const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// GET /api/users - μόνο admin
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;