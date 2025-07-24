const mongoose = require("mongoose");

const alterlifeHistorySchema = new mongoose.Schema({
  customerId: { type: Number, required: true },
  selectedOffer: { type: String, required: true },
  selectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  selectedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AlterlifeHistory", alterlifeHistorySchema);
