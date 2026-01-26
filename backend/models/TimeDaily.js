const mongoose = require("mongoose");

const TimeDailySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dateKey: { type: String, required: true, index: true },

    firstLoginAt: { type: Date, default: null },
    lastLogoutAt: { type: Date, default: null },

    breakMs: { type: Number, default: 0 },
    breakOpenAt: { type: Date, default: null },

    totalPresenceMs: { type: Number, default: 0 },
    workingMs: { type: Number, default: 0 },

    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

TimeDailySchema.index({ userId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("TimeDaily", TimeDailySchema);
