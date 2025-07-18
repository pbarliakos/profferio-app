const mongoose = require("mongoose");

const novaEmailSchema = new mongoose.Schema({
  email: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  byUser: { type: String, required: true }
});

module.exports = mongoose.model("NovaEmail", novaEmailSchema);
