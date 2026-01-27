const { DateTime } = require("luxon");
const TimeDaily = require("../models/TimeDaily");
const TZ = "Europe/Athens";

// --- HELPERS ---
function getDateKey(date = new Date()) {
  return DateTime.fromJSDate(date).setZone(TZ).toFormat("yyyy-LL-dd");
}

function monthRange(monthKey) {
  const start = DateTime.fromFormat(monthKey, "yyyy-LL", { zone: TZ }).startOf("month");
  const end = start.endOf("month");
  return { from: start.toFormat("yyyy-LL-dd"), to: end.toFormat("yyyy-LL-dd") };
}

function computeLive(daily, now = new Date()) {
  if (!daily?.firstLoginAt) return { totalPresenceMs: 0, workingMs: 0 };
  const todayKey = getDateKey(now);
  let endTs;
  if (daily.lastLogoutAt) {
    endTs = new Date(daily.lastLogoutAt);
  } else if (daily.dateKey < todayKey) {
    endTs = DateTime.fromFormat(daily.dateKey, "yyyy-LL-dd", { zone: TZ }).endOf("day").toJSDate();
  } else {
    endTs = now;
  }
  const totalPresenceMs = Math.max(0, endTs.getTime() - new Date(daily.firstLoginAt).getTime());
  let openBreakMs = 0;
  if (daily.breakOpenAt) {
    openBreakMs = Math.max(0, endTs.getTime() - new Date(daily.breakOpenAt).getTime());
  }
  const totalBreakMs = Math.max(0, (daily.breakMs || 0) + openBreakMs);
  return { totalPresenceMs, workingMs: Math.max(0, totalPresenceMs - totalBreakMs) };
}

async function autoCloseOldSessions(userId, todayKey) {
  const oldSessions = await TimeDaily.find({ userId, status: "open", dateKey: { $lt: todayKey } });
  for (const session of oldSessions) {
    const totals = computeLive(session, new Date());
    session.totalPresenceMs = totals.totalPresenceMs;
    session.workingMs = totals.workingMs;
    session.status = "closed";
    session.breakOpenAt = null;
    await session.save();
  }
}

// --- CONTROLLERS ---
exports.timeLogin = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const dateKey = getDateKey(now);
    await autoCloseOldSessions(userId, dateKey);
    let daily = await TimeDaily.findOne({ userId, dateKey });
    if (!daily) {
      daily = await TimeDaily.create({ userId, dateKey, firstLoginAt: now, status: "open" });
    } else if (daily.status === "closed") {
      daily.status = "open";
      daily.lastLogoutAt = null;
    }
    const totals = computeLive(daily, now);
    daily.totalPresenceMs = totals.totalPresenceMs;
    daily.workingMs = totals.workingMs;
    await daily.save();
    res.json({ ok: true, daily });
  } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
};

exports.timeLogout = async (req, res) => {
  try {
    const now = new Date();
    const daily = await TimeDaily.findOne({ userId: req.user.id, dateKey: getDateKey(now) });
    if (!daily) return res.status(400).json({ ok: false, message: "No session found" });
    if (daily.breakOpenAt) {
      daily.breakMs = (daily.breakMs || 0) + Math.max(0, now.getTime() - daily.breakOpenAt.getTime());
      daily.breakOpenAt = null;
    }
    daily.lastLogoutAt = now;
    daily.status = "closed";
    const totals = computeLive(daily, now);
    daily.totalPresenceMs = totals.totalPresenceMs;
    daily.workingMs = totals.workingMs;
    await daily.save();
    res.json({ ok: true, daily });
  } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
};

exports.breakStart = async (req, res) => {
  try {
    const now = new Date();
    const daily = await TimeDaily.findOne({ userId: req.user.id, dateKey: getDateKey(now) });
    if (!daily || daily.status === "closed") return res.status(400).json({ message: "Day inactive" });
    daily.breakOpenAt = now;
    await daily.save();
    res.json({ ok: true, daily });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.breakEnd = async (req, res) => {
  try {
    const now = new Date();
    const daily = await TimeDaily.findOne({ userId: req.user.id, dateKey: getDateKey(now) });
    if (!daily || !daily.breakOpenAt) return res.status(400).json({ message: "No open break" });
    daily.breakMs = (daily.breakMs || 0) + Math.max(0, now.getTime() - daily.breakOpenAt.getTime());
    daily.breakOpenAt = null;
    await daily.save();
    res.json({ ok: true, daily });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDay = async (req, res) => {
  try {
    const now = new Date();
    const daily = await TimeDaily.findOne({ userId: req.user.id, dateKey: req.query.date || getDateKey(now) });
    if (!daily) return res.json({ ok: true, daily: null });
    const dObj = daily.toObject();
    if (dObj.status === "open") {
      const totals = computeLive(daily, now);
      dObj.totalPresenceMs = totals.totalPresenceMs;
      dObj.workingMs = totals.workingMs;
    }
    res.json({ ok: true, daily: dObj });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMonth = async (req, res) => {
  try {
    const { from, to } = monthRange(req.query.month || DateTime.now().setZone(TZ).toFormat("yyyy-LL"));
    const days = await TimeDaily.find({ userId: req.user.id, dateKey: { $gte: from, $lte: to } }).sort({ dateKey: 1 });
    res.json({ ok: true, days });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getLoggedUsers = async (req, res) => {
  try {
    const User = require("../models/User");
    const activeUserIds = await TimeDaily.distinct("userId");
    const users = await User.find({ _id: { $in: activeUserIds } }, "fullName").sort({ fullName: 1 });
    res.json({ ok: true, users });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};


exports.getAdminLogs = async (req, res) => {
  try {
    const { startDate, endDate, userIds } = req.query; 
    let query = {};

    if (startDate || endDate) {
      query.dateKey = {};
      if (startDate) query.dateKey.$gte = startDate;
      if (endDate) query.dateKey.$lte = endDate;
    }

    // Φιλτράρισμα για έναν ή περισσότερους επιλεγμένους χρήστες
    if (userIds && userIds !== "all") {
      const idsArray = userIds.split(",");
      query.userId = { $in: idsArray };
    }

    const logs = await TimeDaily.find(query)
      .populate("userId", "fullName username")
      .sort({ dateKey: -1 });

    res.json({ ok: true, logs });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};