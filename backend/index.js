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

app.use(cors({
  origin: [
    "http://profferio.othisisa.gr",
    "http://profferio.othisisa.gr:3000"
    //"http://localhost:3000"
  ]
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", emailRoutes);
app.use("/api/login-logs", require("./routes/logs"));
app.use("/api/time", timeRoutes);
app.use("/api/time", require("./routes/timeRoutes"));



connectDB();


app.get("/", (req, res) => {
  res.send("Profferio backend is running");
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
})

app.use("/api/users", userRoutes);


cron.schedule("*/1 * * * * *", async () => {
  // κάθε 1 sec
  try {
    await axios.post("http://profferio.othisisa.gr/api/auth/force-close-inactive-sessions");
   // console.log("Checked and closed inactive sessions");
  } catch (err) {
    console.log("Cron error", err.message);
  }
});
