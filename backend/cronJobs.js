const cron = require("node-cron");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const startCronJobs = () => {
  // Ορίζουμε το URL του API (localhost γιατί τρέχει στον ίδιο server)
  // Αν έχεις αλλάξει την πόρτα, βεβαιώσου ότι το PORT είναι σωστό
  const PORT = process.env.PORT || 5000;
  const API_URL = `http://localhost:${PORT}/api/auth`;

  console.log("⏳ Cron Jobs initialized...");

  // ✅ JOB 1: MIDNIGHT KILL SWITCH (23:59:00)
  // Τρέχει κάθε μέρα στις 23:59 ακριβώς
  cron.schedule("59 23 * * *", async () => {
    console.log("🕛 Triggering Midnight Force Close (Non-Admins)...");
    try {
      const res = await axios.post(`${API_URL}/midnight-force-close`);
      console.log("✅ Cron Result:", res.data);
    } catch (err) {
      console.error("❌ Midnight Cron Failed:", err.message);
    }
  }, {
    timezone: "Europe/Athens" // Σιγουρέψου ότι τρέχει σε ώρα Ελλάδας
  });

  // ✅ JOB 2: (Προαιρετικό) AUTO CLOSE PAST DAYS (00:05:00)
  // Καθαρίζει τυχόν υπολείμματα από προηγούμενες μέρες που ίσως ξέφυγαν
  cron.schedule("5 0 * * *", async () => {
    console.log("🧹 Triggering Past Days Cleanup...");
    try {
      const res = await axios.post(`${API_URL}/auto-close-past-days`);
      console.log("✅ Cleanup Result:", res.data);
    } catch (err) {
      console.error("❌ Cleanup Cron Failed:", err.message);
    }
  }, {
    timezone: "Europe/Athens"
  });
};

module.exports = startCronJobs;