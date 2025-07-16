const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    adminUsername: { type: String, required: true },
    action: { type: String, enum: ["create", "update", "delete"], required: true },
    targetUser: { type: String, required: true }, // username ή userId
    details: { type: Object }, // optional: { field: old → new }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);
