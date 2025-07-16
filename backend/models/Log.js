const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    adminUsername: String,
    action: {
      type: String,
      enum: ["create", "update", "delete", "login", "logout"],
      required: true,
    },
    targetUser: String,
    details: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);
