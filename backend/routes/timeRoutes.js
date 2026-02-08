const express = require("express");
const router = express.Router();
const timeController = require("../controllers/timeController");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// ✅ Models
const TimeDaily = require("../models/TimeDaily");
const User = require("../models/User");

if (!protect || !isAdmin) {
    console.error("❌ CRITICAL ERROR: Auth middlewares are missing.");
}

// ================= USER ROUTES =================
router.get("/today", protect, timeController.getTodayStatus);
router.post("/action", protect, timeController.handleAction);
router.get("/history", protect, timeController.getHistory);
router.get('/team-monitor', protect, timeController.getTeamMonitor);

// ================= TEAM LEADER ROUTES =================

// ✅ 1. Get Team Users (Για το Dropdown)
router.get("/team/users", protect, async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "team leader") {
            return res.status(403).json({ message: "Not authorized" });
        }

        let query = {};
        // Αν είναι Team Leader, φέρνουμε μόνο τους χρήστες του ίδιου Project
        if (req.user.role === "team leader") {
            query.project = req.user.project;
        }

        const users = await User.find(query).select("_id fullName username project").sort({ fullName: 1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ 2. Get Team History (Με φίλτρα Date & Users)
router.get("/team/history", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "team leader") {
        return res.status(403).json({ message: "Not authorized" });
    }

    const { startDate, endDate, userIds } = req.query; // userIds: "id1,id2" ή "all"
    let query = {};

    // Φίλτρο Ημερομηνίας
    if (startDate || endDate) {
       query.dateKey = {};
       if (startDate) query.dateKey.$gte = startDate;
       if (endDate) query.dateKey.$lte = endDate;
    }

    // Φίλτρο Χρηστών
    if (req.user.role === "team leader") {
        // Βεβαιωνόμαστε ότι ψάχνει μόνο στο project του
        const myProject = req.user.project;
        
        // Αν έχει επιλέξει συγκεκριμένους χρήστες
        if (userIds && userIds !== "all") {
            const selectedIds = userIds.split(",");
            query.userId = { $in: selectedIds };
        } else {
            // Αν είναι "all", φέρνουμε όλους του project
            const projectUsers = await User.find({ project: myProject }).select('_id');
            const projectUserIds = projectUsers.map(u => u._id);
            query.userId = { $in: projectUserIds };
        }
    } else if (req.user.role === "admin") {
        // Ο Admin μπορεί να ψάξει όποιον θέλει
        if (userIds && userIds !== "all") {
            const selectedIds = userIds.split(",");
            query.userId = { $in: selectedIds };
        }
    }

    const logs = await TimeDaily.find(query)
      .populate("userId", "username role project fullName") 
      .sort({ dateKey: -1 });

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