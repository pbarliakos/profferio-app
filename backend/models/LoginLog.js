const mongoose = require("mongoose");

const LoginLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
  project: String,
  fullName: String,
  loginAt: { type: Date, default: Date.now },
  logoutAt: Date,
  duration: Number // λεπτά
});

module.exports = mongoose.model("LoginLog", LoginLogSchema);
