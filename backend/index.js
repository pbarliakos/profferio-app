const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const emailRoutes = require("./routes/emailRoutes");
const cron = require("node-cron");
const axios = require("axios");
const timeRoutes = require("./routes/timeRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Δυναμικό CORS βάσει του .env
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    `${process.env.FRONTEND_URL}:3000`, // Για development
    "http://localhost:3000"
  ]
}));

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", emailRoutes);
app.use("/api/login-logs", require("./routes/logs"));
app.use("/api/time", timeRoutes);
app.use("/api/users", userRoutes);

// Σύνδεση στη βάση (χρησιμοποιεί το process.env.MONGO_URI αυτόματα)
connectDB();

app.get("/", (req, res) => {
  res.send(`Profferio backend is running on ${process.env.FRONTEND_URL}`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
});

// ✅ Δυναμικό Cron - Χρησιμοποιούμε localhost για να αποφύγουμε 502/Proxy errors
cron.schedule("*/1 * * * * *", async () => {
  try {
    // Καλούμε το API εσωτερικά στον εαυτό του
    await axios.post(`${process.env.INTERNAL_API_URL}/api/auth/force-close-inactive-sessions`);
  } catch (err) {
    console.log("Cron error:", err.message);
  }
});