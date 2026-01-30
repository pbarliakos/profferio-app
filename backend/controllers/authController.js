const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const LoginLog = require("../models/LoginLog");

// ✅ Time Tracking (NEW)
const TimeDaily = require("../models/TimeDaily");
const { DateTime } = require("luxon");
const TZ = "Europe/Athens";

// Register
exports.register = async (req, res) => {
  try {
    const { fullName, username, email, password, role, project } = req.body;

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      role,
      project,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Έλεγχος active session
    const existingSession = await LoginLog.findOne({
      userId: user._id,
      logoutAt: { $exists: false }
    });

    if (existingSession && user.role !== "admin") {
      return res.status(403).json({
        message: "Υπάρχει ήδη ενεργή συνεδρία. Μόνο ένα session επιτρέπεται."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, role: user.role, project: user.project },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Καταγραφή Login
    const now = new Date();
    await LoginLog.create({
      userId: user._id,
      username: user.username,
      project: user.project,
      fullName: user.fullName,
      loginAt: now,
      lastSeen: now
    });

    // ✅ Time Tracking Fix: Αρχικοποίηση με status: "CLOSED"
const dateKey = DateTime.fromJSDate(now).setZone(TZ).toFormat("yyyy-LL-dd");

    await TimeDaily.findOneAndUpdate(
      { userId: user._id, dateKey },
      {
        $setOnInsert: {
          userId: user._id,
          userFullName: user.fullName, // 👈 ΝΕΟ: Αποθηκεύουμε το όνομα εδώ
          dateKey,
          firstLoginAt: null,
          status: "CLOSED",
          storedWorkMs: 0,
          storedBreakMs: 0,
          lastLogoutAt: null,
          lastActionAt: null
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        project: user.project,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Logout: Κλείνει το session στο LoginLog
exports.logout = async (req, res) => {
  try {
    const userId = req.user._id;

    // Βρίσκουμε όλα τα ανοιχτά logs του χρήστη και βάζουμε logoutAt
    await LoginLog.updateMany(
      { userId: userId, logoutAt: { $exists: false } },
      { $set: { logoutAt: new Date() } }
    );

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ error: err.message });
  }
};