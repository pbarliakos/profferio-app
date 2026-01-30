const mongoose = require("mongoose");

const timeDailySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userFullName: { type: String }, // 👈 ΝΕΟ ΠΕΔΙΟ: Κρατάει το όνομα "καρφωτά"
  dateKey: { type: String, required: true },
  
  status: { 
    type: String, 
    enum: ["WORKING", "BREAK", "CLOSED"], 
    default: "CLOSED" 
  },
  // ... τα υπόλοιπα πεδία μένουν ίδια
  firstLoginAt: { type: Date },
  lastLogoutAt: { type: Date },
  storedWorkMs: { type: Number, default: 0 },
  storedBreakMs: { type: Number, default: 0 },
  lastActionAt: { type: Date },
  logs: [{
    action: String, 
    timestamp: Date,
    details: String
  }]
}, { timestamps: true });

timeDailySchema.index({ userId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("TimeDaily", timeDailySchema);