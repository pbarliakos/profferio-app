const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const LoginLog = require("../models/LoginLog");
const TimeDaily = require("../models/TimeDaily");
const { DateTime } = require("luxon");

const TZ = "Europe/Athens";

// Register
exports.register = async (req, res) => {
  try {
    const { fullName, username, email, password, role, project, company } = req.body;

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ FORCE LOWERCASE: Αποθηκεύουμε πάντα πεζά για να μην έχουμε θέματα
    const normalizedRole = role ? role.toLowerCase() : "user";
    const normalizedProject = project ? project.toLowerCase() : "other";

    const user = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      role: normalizedRole,
      project: normalizedProject,
      company, // Η εταιρεία συνήθως μένει όπως είναι (π.χ. Othisi)
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
    // ✅ 1. Υποστήριξη για Identifier (Email ή Username)
    const inputIdentifier = req.body.identifier || req.body.username;
    const { password } = req.body;

    if (!inputIdentifier || !password) {
        return res.status(400).json({ message: "Παρακαλώ εισάγετε Username/Email και Password" });
    }

    // ✅ 2. Αναζήτηση χρήστη (Case insensitive για το username/email)
    // Χρησιμοποιούμε regex για να αγνοήσουμε κεφαλαία/μικρά στο username κατά την αναζήτηση
    const user = await User.findOne({
        $or: [
            { email: { $regex: new RegExp(`^${inputIdentifier}$`, 'i') } },
            { username: { $regex: new RegExp(`^${inputIdentifier}$`, 'i') } }
        ]
    });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Έλεγχος active session
    const existingSession = await LoginLog.findOne({
      userId: user._id,
      logoutAt: { $exists: false }
    });

    // Επιτρέπουμε πολλαπλά sessions ΜΟΝΟ στους admins
    // ✅ Ασφαλής έλεγχος με toLowerCase()
    const userRole = user.role ? user.role.toLowerCase() : "user";
    
    if (existingSession && userRole !== "admin") {
      return res.status(403).json({
        message: "Υπάρχει ήδη ενεργή συνεδρία. Μόνο ένα session επιτρέπεται."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Normalization για το Token και το Response
    const userProject = user.project ? user.project.toLowerCase() : "other";

    // Δημιουργία Token
    const token = jwt.sign(
      { userId: user._id, role: userRole, project: userProject },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const now = new Date();
    
    // Καταγραφή στο LoginLog
    await LoginLog.create({
      userId: user._id,
      username: user.username,
      project: userProject, // Αποθηκεύουμε το normalized project
      fullName: user.fullName,
      loginAt: now,
      lastSeen: now
    });

    // Time Tracking Logic
    const dateKey = DateTime.fromJSDate(now).setZone(TZ).toFormat("yyyy-LL-dd");

    await TimeDaily.findOneAndUpdate(
      { userId: user._id, dateKey },
      {
        $setOnInsert: {
          userId: user._id,
          userFullName: user.fullName,
          userCompany: user.company,
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

    // ✅ 3. Στέλνουμε πίσω καθαρά δεδομένα (Lowercase)
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: userRole,       // Σίγουρα μικρά (π.χ. "user", "admin")
        project: userProject, // Σίγουρα μικρά (π.χ. "epic", "nova")
        fullName: user.fullName,
        company: user.company
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const userId = req.user._id;

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