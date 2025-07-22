const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const emailRoutes = require("./routes/emailRoutes");
const logRoutes = require("./routes/logs");
const cron = require("node-cron");
const axios = require("axios");

// ✅ Φόρτωσε μεταβλητές περιβάλλοντος (.env)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ✅ CORS - προσωρινά όλα, μετά βάζεις συγκεκριμένα origins
app.use(cors());

// ✅ Middleware
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api", emailRoutes);
app.use("/api/login-logs", logRoutes);
app.use("/api/users", userRoutes);

// ✅ Αρχική διαδρομή
app.get("/", (req, res) => {
  res.send("Profferio backend is running");
});

// ✅ Σύνδεση στη βάση και εκκίνηση server
connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// ✅ Cron Job (τρέχει ανά λεπτό)
cron.schedule("*/60 * * * * *", async () => {
  try {
    await axios.post(`${BASE_URL}/api/auth/force-close-inactive-sessions`);
    // console.log("Checked and closed inactive sessions");
  } catch (err) {
    console.log("❌ Cron error:", err.message);
  }
});