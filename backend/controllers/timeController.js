const { DateTime } = require("luxon");
const TimeDaily = require("../models/TimeDaily");

const TZ = "Europe/Athens";

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

  const endTs = daily.lastLogoutAt ? new Date(daily.lastLogoutAt) : now;
  const totalPresenceMs = Math.max(0, endTs.getTime() - new Date(daily.firstLoginAt).getTime());

  let openBreakMs = 0;
  if (daily.breakOpenAt) {
    openBreakMs = Math.max(0, now.getTime() - new Date(daily.breakOpenAt).getTime());
  }

  const totalBreakMs = Math.max(0, (daily.breakMs || 0) + openBreakMs);
  const workingMs = Math.max(0, totalPresenceMs - totalBreakMs);

  return { totalPresenceMs, workingMs };
}

exports.timeLogin = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const dateKey = getDateKey(now);

    let daily = await TimeDaily.findOne({ userId, dateKey });

    // 🟢 Αν ΔΕΝ υπάρχει day → create
    if (!daily) {
      daily = await TimeDaily.create({
        userId,
        dateKey,
        firstLoginAt: now,
        status: "open",
        breakMs: 0,
        breakOpenAt: null,
        totalPresenceMs: 0,
        workingMs: 0,
        lastLogoutAt: null,
      });
    }
    // 🟡 Αν υπάρχει αλλά είναι closed → reopen
    else if (daily.status === "closed") {
      daily.status = "open";
      daily.lastLogoutAt = null;
    }

    // 🔄 Live recompute
    const totals = computeLive(daily, now);
    daily.totalPresenceMs = totals.totalPresenceMs;
    daily.workingMs = totals.workingMs;

    await daily.save();

    res.json({ ok: true, daily });
  } catch (err) {
    console.error("❌ timeLogin error:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
};


exports.timeLogout = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const dateKey = getDateKey(now);

    const daily = await TimeDaily.findOne({ userId, dateKey });
    if (!daily || !daily.firstLoginAt) {
      return res.status(400).json({ ok: false, message: "No open day found" });
    }

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
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.breakStart = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const dateKey = getDateKey(now);

    const daily = await TimeDaily.findOne({ userId, dateKey });
    if (!daily || !daily.firstLoginAt) {
      return res.status(400).json({ ok: false, message: "Day not started" });
    }
    if (daily.status === "closed") {
      return res.status(400).json({ ok: false, message: "Day is closed" });
    }
    if (daily.breakOpenAt) {
      return res.status(400).json({ ok: false, message: "Break already started" });
    }

    daily.breakOpenAt = now;

    const totals = computeLive(daily, now);
    daily.totalPresenceMs = totals.totalPresenceMs;
    daily.workingMs = totals.workingMs;

    await daily.save();
    res.json({ ok: true, daily });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.breakEnd = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const dateKey = getDateKey(now);

    const daily = await TimeDaily.findOne({ userId, dateKey });
    if (!daily || !daily.breakOpenAt) {
      return res.status(400).json({ ok: false, message: "No open break" });
    }

    daily.breakMs = (daily.breakMs || 0) + Math.max(0, now.getTime() - daily.breakOpenAt.getTime());
    daily.breakOpenAt = null;

    const totals = computeLive(daily, now);
    daily.totalPresenceMs = totals.totalPresenceMs;
    daily.workingMs = totals.workingMs;

    await daily.save();
    res.json({ ok: true, daily });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.getDay = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateKey = req.query.date || getDateKey(new Date());

    const daily = await TimeDaily.findOne({ userId, dateKey });
    if (!daily) return res.json({ ok: true, daily: null });

    if (daily.status === "open") {
      const now = new Date();
      const totals = computeLive(daily, now);
      daily.totalPresenceMs = totals.totalPresenceMs;
      daily.workingMs = totals.workingMs;
      await daily.save();
    }

    res.json({ ok: true, daily });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

exports.getMonth = async (req, res) => {
  try {
    const userId = req.user.id;
    const monthKey = req.query.month || DateTime.now().setZone(TZ).toFormat("yyyy-LL");
    const { from, to } = monthRange(monthKey);

    const days = await TimeDaily.find({
      userId,
      dateKey: { $gte: from, $lte: to },
    }).sort({ dateKey: 1 });

    const totals = days.reduce(
      (acc, d) => {
        acc.totalPresenceMs += d.totalPresenceMs || 0;
        acc.breakMs += d.breakMs || 0;
        acc.workingMs += d.workingMs || 0;
        return acc;
      },
      { totalPresenceMs: 0, breakMs: 0, workingMs: 0 }
    );

    res.json({ ok: true, monthKey, range: { from, to }, totals, days });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};
