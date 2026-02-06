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
// Login
exports.login = async (req, res) => {
  try {
    const inputIdentifier = req.body.identifier || req.body.username;
    const { password } = req.body;

    if (!inputIdentifier || !password) {
        return res.status(400).json({ message: "Παρακαλώ εισάγετε Username/Email και Password" });
    }

    const user = await User.findOne({
        $or: [
            { email: { $regex: new RegExp(`^${inputIdentifier}$`, 'i') } },
            { username: { $regex: new RegExp(`^${inputIdentifier}$`, 'i') } }
        ]
    });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ ΒΕΛΤΙΩΜΕΝΟΣ ΕΛΕΓΧΟΣ ACTIVE SESSION
    // Βρες αν υπάρχει ανοιχτό session
    const existingSession = await LoginLog.findOne({
      userId: user._id,
      logoutAt: { $exists: false }
    });

    const userRole = user.role ? user.role.toLowerCase() : "user";
    
    // Αν υπάρχει ανοιχτό session και ο χρήστης ΔΕΝ είναι admin
    if (existingSession && userRole !== "admin") {
        
        // Υπολογισμός: Πόση ώρα έχει περάσει από το lastSeen (σε λεπτά);
        const lastSeenTime = new Date(existingSession.lastSeen).getTime();
        const currentTime = new Date().getTime();
        const diffMinutes = (currentTime - lastSeenTime) / (1000 * 60);

        // 🛑 ΑΛΛΑΓΗ ΕΔΩ: Αν είναι ενεργός τα τελευταία 5 λεπτά, τότε μόνο τον μπλοκάρουμε.
        // Αν έχει περάσει 5λεπτο, θεωρούμε ότι το προηγούμενο tab "πέθανε" και τον αφήνουμε να μπει.
        if (diffMinutes < 2) {
             return res.status(403).json({
                message: "Υπάρχει ήδη ενεργή συνεδρία σε άλλη συσκευή/tab."
             });
        } else {
            // Αν είναι παλιό session (Zombie), το κλείνουμε αυτόματα
            existingSession.logoutAt = new Date();
            existingSession.notes = "Auto-closed by new login (Zombie session)"; // Προαιρετικό log
            await existingSession.save();
        }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const userProject = user.project ? user.project.toLowerCase() : "other";

    // Δημιουργία Token (8 ώρες)
    const token = jwt.sign(
      { userId: user._id, role: userRole, project: userProject },
      process.env.JWT_SECRET,
      { expiresIn: "9h" }
    );

    const now = new Date();
    
    // Καταγραφή νέου LoginLog
    await LoginLog.create({
      userId: user._id,
      username: user.username,
      project: userProject,
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

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: userRole,
        project: userProject,
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

// Heartbeat: Ενημερώνει το lastSeen για να ξέρουμε ότι ο χρήστης είναι online
exports.heartbeat = async (req, res) => {
  try {
    const { userId } = req.body;
    // Ενημερώνουμε μόνο το session που είναι ανοιχτό (χωρίς logoutAt)
    await LoginLog.findOneAndUpdate(
      { userId: userId, logoutAt: { $exists: false } },
      { lastSeen: new Date() }
    );
    res.status(200).send("OK");
  } catch (err) {
    // Δεν χρειάζεται να σκάει με error στο frontend το heartbeat
    console.error("Heartbeat error", err); 
    res.status(200).send("OK");
  }
};