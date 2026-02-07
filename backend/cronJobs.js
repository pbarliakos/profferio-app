const cron = require("node-cron");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const startCronJobs = () => {
  // Define the API URL (localhost since it runs on the same server)
  // Ensure the PORT matches your server configuration
  const PORT = process.env.PORT || 5000;
  const API_URL = `http://localhost:${PORT}/api/auth`;

  console.log("⏳ Cron Jobs initialized...");

  // ✅ JOB 1: MIDNIGHT KILL SWITCH (23:59:00)
  // Runs every day exactly at 23:59
  cron.schedule("59 23 * * *", async () => {
    console.log("🕛 Triggering Midnight Force Close (Non-Admins)...");
    try {
      const res = await axios.post(`${API_URL}/midnight-force-close`);
      console.log("✅ Cron Result:", res.data);
    } catch (err) {
      console.error("❌ Midnight Cron Failed:", err.message);
    }
  }, {
    timezone: "Europe/Athens" // Ensures it runs in Greek time
  });

  // ✅ JOB 2: (Optional) AUTO CLOSE PAST DAYS (00:05:00)
  // Cleans up any remnants from previous days that might have been missed
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