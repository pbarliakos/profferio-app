const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  project: { type: String, required: true },

  category: { 
    type: String, 
    enum: ["Hardware", "Software", "Network", "Access Rights", "CRM/ERP", "Other"],
    required: true 
  },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },

  priority: { 
    type: String, 
    enum: ["Low", "Medium", "High", "Critical"], 
    default: "Medium" 
  },
  
  // ✅ ΕΝΗΜΕΡΩΜΕΝΑ STATUSES
  status: { 
    type: String, 
    enum: [
        "Open",              // Αρχική κατάσταση
        "Assigned",          // Το πήρε Agent (θα το κάνει κάποια στιγμή)
        "In Progress",       // Το δουλεύει ΤΩΡΑ
        "Scheduled",         // Προγραμματίστηκε για μέλλον
        "Reply by IT",       // Απάντησε Admin (περιμένει τον user;)
        "Waiting for Reply", // Απάντησε User (σειρά του Admin)
        "Closed"             // Τέλος
    ], 
    default: "Open" 
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Ποιος το διαχειρίζεται
  attachments: [{ type: String }],

  history: [
    {
      action: { type: String, default: "COMMENT" },
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      details: String,
      timestamp: { type: Date, default: Date.now },
      files: [{ type: String }],
      // ✅ ΠΡΟΣΘΗΚΗ: Απαραίτητο για να αποθηκεύονται τα Internal Notes
      isInternal: { type: Boolean, default: false } 
    }
  ]

}, { timestamps: true });

ticketSchema.pre("save", async function (next) {
  if (!this.ticketId) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.ticketId = `TKT-${randomNum}`;
  }
  next();
});

module.exports = mongoose.model("Ticket", ticketSchema);