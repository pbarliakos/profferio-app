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

// ✅ 1. Import το νέο αρχείο για τα Cron Jobs
const startCronJobs = require("./cronJobs"); 

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
  
  // ✅ 2. Εκκίνηση του Midnight Cron Job (00:01)
  startCronJobs();
});

// ✅ Υπάρχον Δυναμικό Cron (για Inactive Sessions)
// Συνεχίζει να τρέχει παράλληλα με το νέο Midnight Cron
cron.schedule("*/1 * * * * *", async () => {
  try {
    // Καλούμε το API εσωτερικά στον εαυτό του
    // Σιγουρέψου ότι το INTERNAL_API_URL είναι σωστό στο .env (π.χ. http://localhost:5000)
    await axios.post(`${process.env.INTERNAL_API_URL || 'http://localhost:' + PORT}/api/auth/force-close-inactive-sessions`);
  } catch (err) {
    // console.log("Cron error:", err.message); // Commented out to reduce noise if needed
  }
});