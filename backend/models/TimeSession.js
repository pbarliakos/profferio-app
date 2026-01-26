const mongoose = require("mongoose");

const TimeSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD (Europe/Athens)
    type: {
      type: String,
      enum: ["login", "logout", "break_start", "break_end"],
      required: true,
      index: true,
    },
    ts: { type: Date, required: true, index: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Useful indexes
TimeSessionSchema.index({ userId: 1, dateKey: 1, ts: 1 });

module.exports = mongoose.model("TimeSession", TimeSessionSchema);
