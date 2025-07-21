const express = require("express");
const router = express.Router();
const LoginLog = require("../models/LoginLog");
const { protect } = require("../middleware/authMiddleware"); // 👈 Σωστά import

// ✅ handler must be a function
router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const logs = await LoginLog.find().sort({ loginAt: -1 });
    res.json(logs); // ✅ Πρέπει να στείλει loginAt, logoutAt, duration
  } catch (err) {
    res.status(500).json({ error: "Error fetching logs" });
  }
});

module.exports = router;
