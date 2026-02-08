const express = require("express");
const router = express.Router();
const timeController = require("../controllers/timeController");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// ✅ Χρειαζόμαστε τα Models εδώ για το custom φιλτράρισμα του Team Leader
const TimeDaily = require("../models/TimeDaily");
const User = require("../models/User");

// Debugging για σιγουριά
if (!protect || !isAdmin) {
    console.error("❌ CRITICAL ERROR: Auth middlewares are missing. Check middleware/authMiddleware.js");
}

// ================= USER ROUTES =================
router.get("/today", protect, timeController.getTodayStatus);
router.post("/action", protect, timeController.handleAction);
router.get("/history", protect, timeController.getHistory);
router.get('/team-monitor', protect, timeController.getTeamMonitor);

// ================= TEAM LEADER ROUTE (NEW) =================
// ✅ Επιστρέφει τα logs μόνο για το Project του Team Leader
router.get("/team/history", protect, async (req, res) => {
  try {
    // 1. Έλεγχος Δικαιωμάτων (Admin ή Team Leader)
    if (req.user.role !== "admin" && req.user.role !== "team leader") {
        return res.status(403).json({ message: "Not authorized" });
    }

    const { startDate, endDate } = req.query;
    let query = {};

    // 2. Φίλτρο Ημερομηνίας
    if (startDate || endDate) {
       query.dateKey = {};
       if (startDate) query.dateKey.$gte = startDate;
       if (endDate) query.dateKey.$lte = endDate;
    }

    // 3. ΛΟΓΙΚΗ ΓΙΑ TEAM LEADER: Φιλτράρισμα βάσει Project
    if (req.user.role === "team leader") {
        const myProject = req.user.project; // π.χ. "epic"

        // Βρίσκουμε όλους τους χρήστες που ανήκουν στο ίδιο project
        const projectUsers = await User.find({ project: myProject }).select('_id');
        
        // Παίρνουμε τα IDs τους σε έναν πίνακα
        const projectUserIds = projectUsers.map(u => u._id);

        // Προσθέτουμε στο query: Φέρε logs ΜΟΝΟ αν το userId είναι στη λίστα της ομάδας μου
        query.userId = { $in: projectUserIds };
    }

    // 4. Εκτέλεση Query
    const logs = await TimeDaily.find(query)
      .populate("userId", "username role project fullName") // Φέρνουμε τα στοιχεία του χρήστη
      .sort({ dateKey: -1 }); // Τα πιο πρόσφατα πρώτα

    res.json(logs);

  } catch (err) {
    console.error("❌ Error in /team/history:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================= ADMIN ROUTES =================
router.get("/admin/active-users", protect, isAdmin, timeController.getActiveUsers);
router.get("/admin/logs", protect, isAdmin, timeController.getAllLogs);
router.put("/admin/log/:id", protect, isAdmin, timeController.updateLog);

module.exports = router;