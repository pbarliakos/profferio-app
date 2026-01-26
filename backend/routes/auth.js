const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { register, login } = require("../controllers/authController");
const LoginLog = require("../models/LoginLog");
const { protect } = require("../middleware/authMiddleware");

// ✅ Time Tracking
const TimeDaily = require("../models/TimeDaily");
const { DateTime } = require("luxon");
const TZ = "Europe/Athens";

function getDateKey(date = new Date()) {
  return DateTime.fromJSDate(date).setZone(TZ).toFormat("yyyy-LL-dd");
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function closeTimeDailyForUser(userId, when = new Date()) {
  const dateKey = getDateKey(when);
  const daily = await TimeDaily.findOne({ userId, dateKey });

  if (!daily || !daily.firstLoginAt) return null;

  if (daily.breakOpenAt) {
    daily.breakMs = (daily.breakMs || 0) + Math.max(0, when.getTime() - daily.breakOpenAt.getTime());
    daily.breakOpenAt = null;
  }

  daily.lastLogoutAt = when;
  daily.totalPresenceMs = Math.max(0, when.getTime() - daily.firstLoginAt.getTime());
  daily.workingMs = Math.max(0, daily.totalPresenceMs - (daily.breakMs || 0));
  daily.status = "closed";

  await daily.save();
  return daily;
}

router.post("/register", register);
router.post("/login", login);

// ✅ Logout (protected) -> κλείνει ΚΑΙ TimeDaily (End Day / πραγματικό logout)
router.post("/logout", protect, async (req, res) => {
  try {
    const latestLog = await LoginLog.findOne({
      userId: req.user.id,
      logoutAt: { $exists: false }
    }).sort({ loginAt: -1 });

    if (latestLog) {
      const now = new Date();
      latestLog.logoutAt = now;
      latestLog.duration = Math.round((now - latestLog.loginAt) / 60000);
      await latestLog.save();

      // ✅ εδώ κλείνουμε το day (human-friendly κανόνας)
      await closeTimeDailyForUser(req.user.id, now);
    }

    res.json({ message: "Logged out and saved" });
  } catch (err) {
    console.error("❌ /logout error:", err);
    res.status(500).json({ error: err.message || "Logout logging failed" });
  }
});

// ✅ Logout via beacon (unprotected)
// 🚫 Human-friendly: ΔΕΝ κλείνουμε TimeDaily στο refresh/tab close.
router.post("/logout-beacon", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId || !isValidObjectId(userId)) {
      return res.status(200).json({ message: "beacon ignored (invalid userId)" });
    }

    const latestLog = await LoginLog.findOne({
      userId,
      logoutAt: { $exists: false },
    }).sort({ loginAt: -1 });

    if (latestLog) {
      const now = new Date();
      latestLog.logoutAt = now;
      latestLog.duration = Math.round((now - latestLog.loginAt) / 60000);
      await latestLog.save();
    }

    res.json({ message: "Logged out via beacon (session only)" });
  } catch (err) {
    console.error("❌ /logout-beacon error:", err);
    res.status(500).json({ error: err.message || "logout-beacon failed" });
  }
});

// ✅ Force logout (optional: βάλε protect+isAdmin αν θες)
router.post("/force-logout", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const openSessions = await LoginLog.find({
      userId,
      logoutAt: { $exists: false }
    });

    if (!openSessions.length) {
      return res.status(404).json({ message: "No open sessions for this user." });
    }

    const now = new Date();
    for (const log of openSessions) {
      log.logoutAt = now;
      log.duration = Math.round((now - log.loginAt) / 60000);
      await log.save();
    }

    // ✅ force logout κλείνει και TimeDaily (λογικό)
    await closeTimeDailyForUser(userId, now);

    res.json({ message: `Force logout done (${openSessions.length} sessions closed)` });
  } catch (err) {
    console.error("❌ /force-logout error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Open sessions
router.get("/open-sessions", async (req, res) => {
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

// ✅ Heartbeat
router.post("/heartbeat", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId || !isValidObjectId(userId)) {
      return res.status(200).json({ message: "pong (ignored invalid userId)" });
    }

    const now = new Date();

    const latestLog = await LoginLog.findOne({
      userId,
      logoutAt: { $exists: false }
    }).sort({ loginAt: -1 });

    if (latestLog) {
      latestLog.lastSeen = now;
      await latestLog.save();
    }

    res.json({ message: "pong" });
  } catch (err) {
    console.error("❌ /heartbeat error:", err);
    res.status(500).json({ error: err.message || "heartbeat failed" });
  }
});

// ✅ Force close inactive sessions
// ✅ Human-friendly: εδώ (και ΜΟΝΟ εδώ) θα κλείσει day αυτόματα αν ο χρήστης εξαφανιστεί.
router.post("/force-close-inactive-sessions", async (req, res) => {
  try {
    const INACTIVE_SECONDS = 300;
    const threshold = new Date(Date.now() - INACTIVE_SECONDS * 1000);

    const deadLogs = await LoginLog.find({
      logoutAt: { $exists: false },
      lastSeen: { $lt: threshold }
    });

    let closed = 0;
    const now = new Date();

    for (const log of deadLogs) {
      log.logoutAt = now;
      log.duration = Math.round((now - log.loginAt) / 60000);
      await log.save();

      // ✅ εδώ κλείνουμε TimeDaily λόγω inactivity (ok για κανόνα #2)
      await closeTimeDailyForUser(log.userId, now);

      closed++;
    }

    res.json({ message: `Force-closed ${closed} sessions.` });
  } catch (err) {
    console.error("❌ /force-close-inactive-sessions error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
