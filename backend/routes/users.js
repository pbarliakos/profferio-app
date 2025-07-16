const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { protect, isAdmin } = require("../middleware/authMiddleware");
const Log = require("../models/Log");


// GET: όλοι οι χρήστες
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: δημιουργία χρήστη
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const { fullName, username, email, password, role, project } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      role,
      project,
    });

    await newUser.save();
    await Log.create({
  adminUsername: req.user.username,
  action: "create",
  targetUser: username,
});

    res.status(201).json({ message: "User created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: επεξεργασία χρήστη
router.put("/:id", protect, isAdmin, async (req, res) => {
  try {
    const { fullName, username, email, password, role, project } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.fullName = fullName;
    user.username = username;
    user.email = email;
    user.role = role;
    user.project = project;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    await Log.create({
  adminUsername: req.user.username,
  action: "update",
  targetUser: username,
});

    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: διαγραφή χρήστη
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Log.create({
  adminUsername: req.user.username,
  action: "delete",
  targetUser: req.params.id,
});

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;