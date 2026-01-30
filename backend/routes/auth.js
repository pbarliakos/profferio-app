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

    const latestLog = await LoginLog.findOne({
      userId: userId,
      logoutAt: { $exists: false }
    }).sort({ loginAt: -1 });

    if (latestLog) {
      latestLog.logoutAt = now;
      latestLog.duration = Math.round((now - latestLog.loginAt) / 60000);
      await latestLog.save();
    }

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
    const latestLog = await LoginLog.findOne({
      userId,
      logoutAt: { $exists: false },
    }).sort({ loginAt: -1 });

    if (latestLog) {
      latestLog.logoutAt = now;
      latestLog.duration = Math.round((now - latestLog.loginAt) / 60000);
      await latestLog.save();
    }

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
    const INACTIVE_SECONDS = 300; 
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
      await forceCloseDay(log.userId);
      closedCount++;
    }
    res.json({ message: `Force-closed ${closedCount} sessions.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 6. OPEN SESSIONS (Για το Agent Monitor)
router.get("/open-sessions", protect, async (req, res) => {
  try {
    // Επιστρέφουμε όλα τα logs που δεν έχουν logoutAt
    const openSessions = await LoginLog.find({
      logoutAt: { $exists: false }
    }).populate("userId", "username fullName role project");
    
    res.json(openSessions);
  } catch (err) {
    console.error("❌ /open-sessions error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ 7. FORCE LOGOUT (Για το Agent Monitor - Admin Button)
router.post("/force-logout", protect, async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ message: "UserId required" });

    const now = new Date();

    // Κλείσιμο Sessions
    await LoginLog.updateMany(
      { userId: userId, logoutAt: { $exists: false } },
      { $set: { logoutAt: now } }
    );

    // Κλείσιμο TimeDaily
    await forceCloseDay(userId);

    res.json({ message: "User force logged out successfully" });
  } catch (err) {
    console.error("❌ /force-logout error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;