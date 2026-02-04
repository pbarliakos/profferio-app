const express = require("express");
const router = express.Router();
const timeController = require("../controllers/timeController");

// 👇 ΔΙΟΡΘΩΣΗ: Κάνουμε import ΚΑΙ τα δύο middleware
const { protect, isAdmin } = require("../middleware/authMiddleware"); 

// Debugging για σιγουριά
if (!protect || !isAdmin) {
    console.error("❌ CRITICAL ERROR: Auth middlewares are missing. Check middleware/authMiddleware.js");
}

// --- USER ROUTES ---
router.get("/today", protect, timeController.getTodayStatus);
router.post("/action", protect, timeController.handleAction);
router.get("/history", protect, timeController.getHistory);
router.get('/team-monitor', protect, timeController.getTeamMonitor);

// --- ADMIN ROUTES ---
// Τώρα το 'isAdmin' υπάρχει και δεν θα πετάει error
router.get("/admin/active-users", protect, isAdmin, timeController.getActiveUsers);
router.get("/admin/logs", protect, isAdmin, timeController.getAllLogs);
router.put("/admin/log/:id", protect, isAdmin, timeController.updateLog);

module.exports = router;