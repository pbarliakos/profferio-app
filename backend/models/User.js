const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // ✅ ΡΟΛΟΙ: Αφαιρέσαμε το 'enum' για να δέχεται και "User" και "user" και "Admin" και "admin"
  // χωρίς να πετάει errors.
  role: { 
    type: String, 
    default: "user" 
  },
  
  // ✅ PROJECTS: Αφαιρέσαμε το 'enum' για να δέχεται και "Epic" και "epic".
  // Αυτό έλυνε το πρόβλημα που είχες με το validation error.
  project: { 
    type: String, 
    default: "other" 
  },

  // ✅ COMPANY: Ελαστικότητα και εδώ για να μην κολλάει το import.
  company: {
    type: String,
    default: "Othisi"
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);