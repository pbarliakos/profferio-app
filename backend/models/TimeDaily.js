const mongoose = require("mongoose");

const timeDailySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dateKey: { type: String, required: true }, // Format: "YYYY-MM-DD" (για μοναδικότητα ανά ημέρα)
  
  // Κατάσταση τώρα
  status: { 
    type: String, 
    enum: ["WORKING", "BREAK", "CLOSED"], 
    default: "CLOSED" 
  },

  // Timestamps έναρξης/λήξης ημέρας
  firstLoginAt: { type: Date },
  lastLogoutAt: { type: Date },

  // Μετρητές (συσσωρευμένος χρόνος σε milliseconds από προηγούμενα sessions της ίδιας μέρας)
  storedWorkMs: { type: Number, default: 0 },
  storedBreakMs: { type: Number, default: 0 },

  // Πότε έγινε η τελευταία αλλαγή κατάστασης (για τον υπολογισμό του τρέχοντος χρόνου)
  lastActionAt: { type: Date },

  // Ιστορικό ενεργειών (προαιρετικό, για audit)
  logs: [{
    action: String, // START, BREAK_START, BREAK_END, STOP
    timestamp: Date
  }]
}, { timestamps: true });

// Composite index για να βρίσκουμε γρήγορα την εγγραφή της ημέρας για τον χρήστη
timeDailySchema.index({ userId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("TimeDaily", timeDailySchema);