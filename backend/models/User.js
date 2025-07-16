const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ["admin", "manager", "user"], default: "user" },
  project:  { type: String, enum: ["alterlife","admin", "other"], required: true }
}, { timestamps: true });


module.exports = mongoose.model("User", userSchema);
