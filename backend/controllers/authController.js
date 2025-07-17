const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, project } = req.body;

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ fullName, username, email, password: hashedPassword, role, project });
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, role: user.role, project: user.project },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Send token + fullName
    res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        project: user.project,
        fullName: user.fullName,
      },
    });

    // ✅ Log the login AFTER response (non-blocking, no await)
    Log.create({
      adminUsername: user.username,
      action: "login",
      targetUser: user.username,
    }).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
