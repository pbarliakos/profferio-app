const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const LoginLog = require("../models/LoginLog");

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

    // 👉 Έλεγχος αν υπάρχει ήδη ενεργό session (loginLog χωρίς logoutAt)
    const existingSession = await LoginLog.findOne({
      userId: user._id,
      logoutAt: { $exists: false }
    });

if (existingSession && user.role !== "admin") {
  return res.status(403).json({
    message: "Υπάρχει ήδη ενεργή συνεδρία για αυτό το όνομα χρήστη. Μόνο ένα session επιτρέπεται κάθε φορά."
  });
}

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        project: user.project,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 🐞 LOG εδώ:
    console.log("✅ Login attempt for user:", user.username);

    // 🐞 DEBUG τιμές που σπάνε συχνά:
    console.log("project:", user.project);
    console.log("fullName:", user.fullName);

    await LoginLog.create({
      userId: user._id,
      username: user.username,
      project: user.project,
      fullName: user.fullName,
      loginAt: new Date(),
      lastSeen: new Date()
    });

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