const express = require("express");
const router = express.Router();
const timeController = require("../controllers/timeController");
const authMiddleware = require("../middleware/authMiddleware"); 

// Διασφάλιση ότι πήραμε το 'protect' σωστά
const protect = authMiddleware.protect;

// DEBUGGING: Αν αυτό τυπώσει 'undefined' στο τερματικό, υπάρχει θέμα στο authMiddleware.js
console.log("--> TimeRoutes: Protect Middleware is:", typeof protect); 

if (typeof protect !== 'function') {
    console.error("❌ CRITICAL ERROR: 'protect' middleware is NOT a function. Check middleware/authMiddleware.js exports!");
}

// Routes
// Χρησιμοποιούμε το protect ΜΟΝΟ αν είναι function, αλλιώς θα σκάσει
if (typeof protect === 'function') {
    router.get("/today", protect, timeController.getTodayStatus);
    router.post("/action", protect, timeController.handleAction);
    router.get("/history", protect, timeController.getHistory);
}

module.exports = router;