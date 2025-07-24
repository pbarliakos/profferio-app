const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const emailRoutes = require("./routes/emailRoutes");
const cron = require("node-cron");
const axios = require("axios");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: [
    "http://profferio.othisisa.gr",
    "http://profferio.othisisa.gr:3000",
    "http://localhost:3000",
    "https://profferio-frontend-staging.onrender.com",
    "https://profferio-backend-staging.onrender.com"
  ],
  credentials: true,
}));

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", emailRoutes);
app.use("/api/login-logs", require("./routes/logs"));

connectDB();

app.get("/", (req, res) => {
  res.send("Profferio backend is running");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
});

app.use("/api/users", userRoutes);

// ✅ Σωστό cron που καλεί πάντα τον τοπικό server
const BASE_URL = `http://localhost:${PORT}`;
cron.schedule("*/1 * * * * *", async () => {
  // κάθε 1 sec
  try {
    await axios.post(`${BASE_URL}/api/auth/force-close-inactive-sessions`);
    // console.log("Checked and closed inactive sessions");
  } catch (err) {
    console.log("Cron error", err.message);
  }
});