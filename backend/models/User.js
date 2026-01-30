const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // ✅ ΝΕΟΙ ΡΟΛΟΙ
  role: { 
    type: String, 
    enum: ["admin", "manager", "user", "Backoffice", "Team Leader"], 
    default: "user" 
  },
  
  // ✅ ΝΕΑ PROJECTS
  project: { 
    type: String, 
    enum: ["alterlife", "nova", "admin", "time", "other", "Epic", "Instacar", "Nova FTTH"], 
    required: true 
  },

  // ✅ ΝΕΟ ΠΕΔΙΟ: COMPANY
  company: {
    type: String,
    enum: ["Othisi", "Infovest", "Infosale", "Korcavest", "Gemini", "Kontakt"],
    required: true // Ή false αν θες να είναι προαιρετικό για αρχή
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);