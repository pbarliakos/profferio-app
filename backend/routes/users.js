const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// 1. GET ALL USERS (Admin Only)
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    // Φέρνουμε όλους τους χρήστες (χωρίς το password)
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE USER (Admin Only)
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    // ✅ Προσθήκη του 'company' στο destructuring
    const { fullName, username, email, password, role, project, company } = req.body;

    // Έλεγχος αν υπάρχει ήδη
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Το Username χρησιμοποιείται ήδη" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      role,
      project,
      company: company || "Othisi" // Default τιμή αν ξεχαστεί
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    console.error("Create User Error:", err);
    res.status(500).json({ message: "Αποτυχία δημιουργίας χρήστη", error: err.message });
  }
});

// 3. UPDATE USER (Admin Only)
router.put("/:id", protect, isAdmin, async (req, res) => {
  try {
    const { fullName, username, email, role, project, password, company } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Ο χρήστης δεν βρέθηκε" });
    }

    // Ενημέρωση πεδίων
    user.fullName = fullName || user.fullName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;
    user.project = project || user.project;
    
    // ✅ Ενημέρωση Company
    if (company) {
        user.company = company;
    }

    // Ενημέρωση κωδικού ΜΟΝΟ αν έχει συμπληρωθεί νέος
    if (password && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();
    
    // Επιστρέφουμε τον χρήστη χωρίς το password
    updatedUser.password = undefined;
    res.json(updatedUser);

  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ message: "Αποτυχία ενημέρωσης χρήστη", error: err.message });
  }
});

// 4. DELETE USER (Admin Only)
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Ο χρήστης δεν βρέθηκε" });
    }

    // Αποφυγή διαγραφής του εαυτού μας (προαιρετικό αλλά καλό)
    if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: "Δεν μπορείτε να διαγράψετε τον εαυτό σας" });
    }

    await user.deleteOne();
    res.json({ message: "Ο χρήστης διαγράφηκε" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;