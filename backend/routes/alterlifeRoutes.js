const express = require("express");
const router = express.Router();
const AlterlifeCustomer = require("../models/AlterlifeCustomer");
const AlterlifeHistory = require("../models/AlterlifeHistory");
const { protect } = require("../middleware/authMiddleware");

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