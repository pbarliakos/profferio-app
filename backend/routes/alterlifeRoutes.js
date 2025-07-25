const express = require("express");
const router = express.Router();
const AlterlifeCustomer = require("../models/AlterlifeCustomer");
const AlterlifeHistory = require("../models/AlterlifeHistory");
const { protect } = require("../middleware/authMiddleware");


// 🔍 GET /api/alterlife/history
router.get("/history", protect, async (req, res) => {
  try {
    const { customerId, from, to, page = 1, limit = 20 } = req.query;
    const query = {};

    if (customerId) query.customerId = customerId;
    if (from || to) {
      query.selectedAt = {};
      if (from) query.selectedAt.$gte = new Date(from);
      if (to) query.selectedAt.$lte = new Date(to);
    }
    
    if (req.user?.role !== "admin") {
      query.selectedBy = req.user._id;
    }

    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      AlterlifeHistory.find(query)
        .populate("selectedBy", "username")
        .sort({ selectedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AlterlifeHistory.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);
    res.json({ results, totalPages });
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔍 GET /api/alterlife/:customerId
router.get("/:customerId", protect, async (req, res) => {
  try {
    const customer = await AlterlifeCustomer.findOne({ customerId: req.params.customerId });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const history = await AlterlifeHistory.find({ customerId: req.params.customerId })
      .populate("selectedBy", "username email")
      .sort({ selectedAt: -1 });

    res.json({ customer, history });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST /api/alterlife/:customerId/select-offer
router.post("/:customerId/select-offer", protect, async (req, res) => {
  const { selectedOffer } = req.body;
  if (!selectedOffer) return res.status(400).json({ message: "Offer is required" });

  try {
    const customer = await AlterlifeCustomer.findOne({ customerId: req.params.customerId });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const entry = await AlterlifeHistory.create({
      customerId: req.params.customerId,
      selectedOffer,
      selectedBy: req.user._id,
    });

    res.status(201).json({ message: "Offer selection saved", entry });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});  

module.exports = router;