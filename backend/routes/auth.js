const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const LoginLog = require("../models/LoginLog");
const { protect } = require("../middleware/authMiddleware"); // 🛡️ προστασία με token

router.post("/register", register);
router.post("/login", login);

// ✅ ΝΕΟ logout με καταγραφή
router.post("/logout", protect, async (req, res) => {
  try {
    const latestLog = await LoginLog.findOne({
      userId: req.user.id,
      logoutAt: { $exists: false }
    }).sort({ loginAt: -1 });

    if (latestLog) {
      const now = new Date();
      const duration = Math.round((now - latestLog.loginAt) / 60000); // σε λεπτά

      latestLog.logoutAt = now;
      latestLog.duration = duration;
      await latestLog.save();
    }

    res.json({ message: "Logged out and saved" });
  } catch (err) {
    res.status(500).json({ error: "Logout logging failed" });
  }
});


router.post("/logout-beacon", async (req, res) => {
  const { userId } = req.body;

  const latestLog = await LoginLog.findOne({
    userId,
    logoutAt: { $exists: false },
  }).sort({ loginAt: -1 });

  if (latestLog) {
    const now = new Date();
    const duration = Math.round((now - latestLog.loginAt) / 60000);
    latestLog.logoutAt = now;
    latestLog.duration = duration;
    await latestLog.save();
  }

  res.json({ message: "Logged out via beacon" });
});


// Μπορείς να προσθέσεις έλεγχο admin με middleware αν θέλεις!
router.post("/force-logout", async (req, res) => {
  const { userId } = req.body;

  try {
    // Βρίσκουμε όλα τα ανοικτά sessions για τον user
    const openSessions = await LoginLog.find({
      userId,
      logoutAt: { $exists: false }
    });

    if (!openSessions.length) {
      return res.status(404).json({ message: "No open sessions for this user." });
    }

    for (const log of openSessions) {
      const now = new Date();
      const duration = Math.round((now - log.loginAt) / 60000);

      log.logoutAt = now;
      log.duration = duration;
      await log.save();
    }

    res.json({ message: `Force logout done (${openSessions.length} sessions closed)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;