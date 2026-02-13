const express = require("express");
const router = express.Router();
const { createTicket, getTickets, getTicketById, updateTicket } = require("../controllers/ticketController");
const { protect } = require("../middleware/authMiddleware"); // Login required
const upload = require("../middleware/uploadMiddleware"); // File handling

// 1. Create Ticket (Με υποστήριξη πολλαπλών αρχείων, max 5)
router.post("/", protect, upload.array("attachments", 5), createTicket);

// 2. Get All Tickets (με φίλτρα βάσει ρόλου)
router.get("/", protect, getTickets);

// 3. Get Single Ticket Details
router.get("/:id", protect, getTicketById);

// 4. Update / Reply to Ticket (Αλλαγή status, σχόλια, αρχεία)
router.put("/:id", protect, upload.array("attachments", 5), updateTicket);

module.exports = router;