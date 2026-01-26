const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const timeController = require("../controllers/timeController");

// Events
router.post("/login", protect, timeController.timeLogin);
router.post("/logout", protect, timeController.timeLogout);
router.post("/break/start", protect, timeController.breakStart);
router.post("/break/end", protect, timeController.breakEnd);

// Reports
router.get("/day", protect, timeController.getDay);
router.get("/month", protect, timeController.getMonth);

module.exports = router;
