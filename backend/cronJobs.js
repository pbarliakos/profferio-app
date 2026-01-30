const cron = require("node-cron");
const mongoose = require("mongoose");
const { DateTime } = require("luxon");

// Models (Βεβαιώσου ότι τα paths είναι σωστά)
const TimeDaily = require("./models/TimeDaily");
const LoginLog = require("./models/LoginLog");

const TZ = "Europe/Athens";

const startCronJobs = () => {
  // ✅ Ρύθμιση: Τρέχει κάθε μέρα στις 00:01
  // Η σύνταξη είναι: "λεπτό ώρα ημέρα μήνας ημέρα_εβδομάδας"
  cron.schedule("5 0 * * *", async () => {
    console.log("⏰ CRON JOB STARTED: Auto-closing past days...");

    try {
      // 1. Βρίσκουμε τη σημερινή ημερομηνία (π.χ. αν είναι 00:01 της 11ης, θέλουμε την 11η)
      const todayStr = DateTime.now().setZone(TZ).toFormat("yyyy-MM-dd");

      // 2. Βρίσκουμε όλα τα logs που ΔΕΝ είναι σημερινά και είναι ακόμα ανοιχτά
      const stuckLogs = await TimeDaily.find({
        dateKey: { $ne: todayStr }, // Όχι σημερινό
        status: { $in: ["WORKING", "BREAK"] } // Είναι ακόμα ανοιχτό
      });

      if (stuckLogs.length === 0) {
        console.log("✅ No stuck logs found from previous days.");
        return;
      }

      let closedCount = 0;

      for (const log of stuckLogs) {
        // Υπολογίζουμε το τέλος της ημέρας εκείνης (23:59:59)
        const endOfDay = DateTime.fromFormat(log.dateKey, "yyyy-MM-dd", { zone: TZ })
          .endOf("day")
          .toJSDate();

        let elapsed = 0;
        if (log.lastActionAt) {
          elapsed = endOfDay.getTime() - new Date(log.lastActionAt).getTime();
          if (elapsed < 0) elapsed = 0;
        }

        if (log.status === "WORKING") {
          log.storedWorkMs += elapsed;
        } else if (log.status === "BREAK") {
          log.storedBreakMs += elapsed;
        }

        log.status = "CLOSED";
        log.lastLogoutAt = endOfDay;
        log.lastActionAt = endOfDay;
        
        log.logs.push({ 
          action: "AUTO_CLOSE_MIDNIGHT", 
          timestamp: new Date(), 
          details: "Closed automatically by Cron Job at 00:01"
        });

        await log.save();
        
        // Κλείνουμε και το LoginLog session αν υπάρχει ξεχασμένο
        await LoginLog.updateMany(
          { userId: log.userId, logoutAt: { $exists: false } },
          { $set: { logoutAt: endOfDay } }
        );

        closedCount++;
      }

      console.log(`✅ CRON JOB FINISHED: Auto-closed ${closedCount} past day logs.`);
    } catch (err) {
      console.error("❌ CRON JOB ERROR:", err);
    }
  }, {
    timezone: "Europe/Athens" // Σημαντικό για να τρέχει στη σωστή ώρα Ελλάδας
  });
};

module.exports = startCronJobs;