const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { DateTime } = require("luxon");

// Controllers & Middleware
const { register, login } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Models
const LoginLog = require("../models/LoginLog");
const TimeDaily = require("../models/TimeDaily");

// Χρειαζόμαστε το User model για να ελέγξουμε τα roles
const User = require("../models/User"); 

const TZ = "Europe/Athens";

// ✅ Helper: Κλείνει τη μέρα με το ΝΕΟ Schema
async function forceCloseDay(userId) {
  const now = new Date();
  const dateKey = DateTime.now().setZone(TZ).toFormat("yyyy-MM-dd");

  try {
    const daily = await TimeDaily.findOne({ userId, dateKey });

    if (!daily || daily.status === "CLOSED") return;

    let elapsed = 0;
    if (daily.lastActionAt) {
      elapsed = now.getTime() - new Date(daily.lastActionAt).getTime();
    }

    if (daily.status === "WORKING") {
      daily.storedWorkMs += elapsed;
    } else if (daily.status === "BREAK") {
      daily.storedBreakMs += elapsed;
    }

    daily.status = "CLOSED";
    daily.lastLogoutAt = now;
    daily.lastActionAt = now;
    
    daily.logs.push({ action: "FORCE_STOP", timestamp: now });

    await daily.save();
    console.log(`✅ Auto-closed day for user ${userId}`);
  } catch (err) {
    console.error(`❌ Error force-closing day for user ${userId}:`, err);
  }
}

// ================= ROUTES =================

// 1. Register & Login
router.post("/register", register);
router.post("/login", login);

// 2. Logout (User Action)
router.post("/logout", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Κλείσιμο Sessions
    const latestLog = await LoginLog.findOne({
      userId: userId,
      logoutAt: { $exists: false }
    }).sort({ loginAt: -1 });

    if (latestLog) {
      latestLog.logoutAt = now;
      latestLog.duration = Math.round((now - latestLog.loginAt) / 60000);
      await latestLog.save();
    }

    // Κλείσιμο TimeDaily
    await forceCloseDay(userId);

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("❌ Logout error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Logout via Beacon (Tab Close)
router.post("/logout-beacon", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({ message: "Ignored invalid userId" });
    }

    const now = new Date();
    // Κλείνουμε το session
    const latestLog = await LoginLog.findOne({
      userId,
      logoutAt: { $exists: false },
    }).sort({ loginAt: -1 });

    if (latestLog) {
      latestLog.logoutAt = now;
      latestLog.duration = Math.round((now - latestLog.loginAt) / 60000);
      await latestLog.save();
    }

    // Κλείνουμε και τη μέρα για ασφάλεια
    await forceCloseDay(userId);

    res.json({ message: "Beacon logout processed" });
  } catch (err) {
    console.error("❌ Beacon error:", err);
    res.status(200).end(); 
  }
});

// 4. Heartbeat
router.post("/heartbeat", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({ message: "pong" });
    }
    const latestLog = await LoginLog.findOne({
      userId,
      logoutAt: { $exists: false }
    }).sort({ loginAt: -1 });

    if (latestLog) {
      latestLog.lastSeen = new Date();
      await latestLog.save();
    }
    res.json({ message: "pong" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. CRON JOB: Force Close Inactive Sessions
router.post("/force-close-inactive-sessions", async (req, res) => {
  try {
    const INACTIVE_SECONDS = 90;
    const threshold = new Date(Date.now() - INACTIVE_SECONDS * 1000);

    const deadLogs = await LoginLog.find({
      logoutAt: { $exists: false },
      lastSeen: { $lt: threshold }
    });

    const now = new Date();
    let closedCount = 0;

    for (const log of deadLogs) {
      log.logoutAt = now;
      log.duration = Math.round((now - log.loginAt) / 60000);
      await log.save();
      
      // Κλείνουμε και τη μέρα του συγκεκριμένου χρήστη
      await forceCloseDay(log.userId);
      closedCount++;
    }
    res.json({ message: `Force-closed ${closedCount} sessions.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. OPEN SESSIONS (Agent Monitor)
router.get("/open-sessions", protect, async (req, res) => {
  try {
    const openSessions = await LoginLog.find({
      logoutAt: { $exists: false }
    }).populate("userId", "username fullName role project");
    
    res.json(openSessions);
  } catch (err) {
    console.error("❌ /open-sessions error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ 7. FORCE LOGOUT (ΔΙΟΡΘΩΜΕΝΟ)
// Κλείνει ΟΛΑ τα active sessions του χρήστη και τερματίζει το TimeDaily
router.post("/force-logout", protect, async (req, res) => {
  try {
    const { userId } = req.body || {};
    
    if (!userId) {
        return res.status(400).json({ message: "UserId required" });
    }

    const now = new Date();

    // 1. Κλείνουμε ΟΛΑ τα ανοιχτά sessions αυτού του χρήστη (ανεξαρτήτως logId)
    // Αυτό λύνει το πρόβλημα με τους Admins που έχουν πολλαπλά sessions
    const result = await LoginLog.updateMany(
      { userId: userId, logoutAt: { $exists: false } }, 
      { 
        $set: { 
          logoutAt: now,
          // Υπολογισμός διάρκειας κατά προσέγγιση (γιατί το updateMany δεν επιτρέπει dynamic calc εύκολα χωρίς aggregation pipeline)
          // Αλλά για force logout αρκεί να κλείσει.
        } 
      }
    );

    // 2. Κλείσιμο TimeDaily (Τερματισμός Εργασίας)
    await forceCloseDay(userId);

    console.log(`🔌 Admin force-logged out user ${userId}. Closed ${result.modifiedCount} sessions.`);
    res.json({ message: `User force logged out successfully. Closed ${result.modifiedCount} sessions.` });
  } catch (err) {
    console.error("❌ /force-logout error:", err);
    res.status(500).json({ error: err.message });
  }
});
// ✅ 8. AUTO-CLOSE PAST DAYS (Για ξεχασμένα Logouts προηγούμενων ημερών)
// Αυτό πρέπει να καλείται μία φορά την ημέρα (π.χ. στις 00:05) ή μαζί με το inactive sessions cron
router.post("/auto-close-past-days", async (req, res) => {
  try {
    // 1. Βρίσκουμε τη σημερινή ημερομηνία
    const todayStr = DateTime.now().setZone(TZ).toFormat("yyyy-MM-dd");

    // 2. Βρίσκουμε όλα τα logs που ΔΕΝ είναι σημερινά και είναι ακόμα ανοιχτά
    const stuckLogs = await TimeDaily.find({
      dateKey: { $ne: todayStr }, // Όχι σημερινό
      status: { $in: ["WORKING", "BREAK"] } // Είναι ακόμα ανοιχτό
    });

    let closedCount = 0;

    for (const log of stuckLogs) {
      // Υπολογίζουμε το τέλος της ημέρας εκείνης (23:59:59)
      // Προσοχή: Το dateKey είναι string "YYYY-MM-DD"
      // Φτιάχνουμε ημερομηνία τέλους ημέρας σε Athens Zone
      const endOfDay = DateTime.fromFormat(log.dateKey, "yyyy-MM-dd", { zone: TZ })
        .endOf("day")
        .toJSDate();

      let elapsed = 0;
      if (log.lastActionAt) {
        // Υπολογίζουμε χρόνο από την τελευταία ενέργεια μέχρι το τέλος της ημέρας
        elapsed = endOfDay.getTime() - new Date(log.lastActionAt).getTime();
        // Ασφάλεια: Αν για κάποιο λόγο βγει αρνητικό, το κάνουμε 0
        if (elapsed < 0) elapsed = 0;
      }

      if (log.status === "WORKING") {
        log.storedWorkMs += elapsed;
      } else if (log.status === "BREAK") {
        log.storedBreakMs += elapsed;
      }

      log.status = "CLOSED";
      log.lastLogoutAt = endOfDay; // Το κλείνουμε στις 23:59:59
      log.lastActionAt = endOfDay;
      
      log.logs.push({ 
        action: "AUTO_CLOSE_MIDNIGHT", 
        timestamp: new Date(), // Καταγράφουμε πότε τρέξαμε το script (τώρα)
        details: "Closed automatically because day passed"
      });

      await log.save();
      
      // Κλείνουμε και το LoginLog session αν υπάρχει ξεχασμένο
      await LoginLog.updateMany(
        { userId: log.userId, logoutAt: { $exists: false } },
        { $set: { logoutAt: endOfDay } }
      );

      closedCount++;
    }

    res.json({ message: `Auto-closed ${closedCount} past day logs.` });
  } catch (err) {
    console.error("❌ Error in auto-close-past-days:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ 9. MIDNIGHT HARD STOP (ΕΚΤΟΣ ADMINS)
// Καλείται από το Cron Job στις 23:59
router.post("/midnight-force-close", async (req, res) => {
  const now = new Date();
  
  try {
    console.log("🕛 Midnight Protocol initiated...");

    // 1. Βρίσκουμε όλους τους χρήστες που ΔΕΝ είναι admin
    const nonAdminUsers = await User.find({ role: { $ne: "admin" } }).select("_id");
    const nonAdminIds = nonAdminUsers.map(u => u._id);

    if (nonAdminIds.length === 0) {
      return res.json({ message: "No non-admin users found to close." });
    }

    // 2. Κλείνουμε τα LoginLogs (Sessions) για αυτούς τους χρήστες
    // Ενημερώνουμε όλα τα ανοιχτά logs βάζοντας logoutAt = τώρα
    const logsResult = await LoginLog.updateMany(
      { 
        userId: { $in: nonAdminIds }, 
        logoutAt: { $exists: false } 
      },
      { 
        $set: { 
          logoutAt: now,
          forced: true // Προαιρετικό flag για να ξέρουμε ότι έκλεισε βίαια
        } 
      }
    );

    // 3. Κλείνουμε τα TimeDaily (Χρόνους Εργασίας)
    // Πρέπει να τα βρούμε ένα-ένα για να υπολογίσουμε σωστά τον χρόνο που πέρασε
    const activeTimeLogs = await TimeDaily.find({
      userId: { $in: nonAdminIds },
      status: { $in: ["WORKING", "BREAK"] }
    });

    let timeClosedCount = 0;

    for (const daily of activeTimeLogs) {
      let elapsed = 0;
      
      if (daily.lastActionAt) {
        elapsed = now.getTime() - new Date(daily.lastActionAt).getTime();
        // Αν για κάποιο λόγο βγει αρνητικό (σπάνιο), το μηδενίζουμε
        if (elapsed < 0) elapsed = 0;
      }

      // Προσθέτουμε τον χρόνο στο σωστό bucket
      if (daily.status === "WORKING") {
        daily.storedWorkMs += elapsed;
      } else if (daily.status === "BREAK") {
        daily.storedBreakMs += elapsed;
      }

      // Κλείσιμο ημέρας
      daily.status = "CLOSED";
      daily.lastLogoutAt = now;
      daily.lastActionAt = now;
      daily.logs.push({ 
        action: "MIDNIGHT_FORCE_STOP", 
        timestamp: now,
        details: "System auto-closed day at 23:59"
      });

      await daily.save();
      timeClosedCount++;
    }

    console.log(`✅ Midnight Cleanup: Closed ${logsResult.modifiedCount} sessions and ${timeClosedCount} time records (Non-Admins only).`);
    
    res.json({ 
      message: "Midnight cleanup complete", 
      closedSessions: logsResult.modifiedCount, 
      closedTimeRecords: timeClosedCount 
    });

  } catch (err) {
    console.error("❌ Midnight cleanup error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;