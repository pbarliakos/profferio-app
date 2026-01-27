const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/authMiddleware");
const timeController = require("../controllers/timeController");

// User Routes
router.post("/login", protect, timeController.timeLogin);
router.post("/logout", protect, timeController.timeLogout);
router.post("/break/start", protect, timeController.breakStart);
router.post("/break/end", protect, timeController.breakEnd);
router.get("/day", protect, timeController.getDay);
router.get("/month", protect, timeController.getMonth);

// Admin Routes
router.get("/admin/logs", protect, isAdmin, timeController.getAdminLogs);
router.get("/admin/active-users", protect, isAdmin, timeController.getLoggedUsers);

module.exports = router;