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
const ticketRoutes = require("./routes/ticketRoutes");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const startCronJobs = require("./cronJobs"); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      `${process.env.FRONTEND_URL}:3000`,
      "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set("io", io);

// ✅ SOCKET.IO ROOM LOGIC
io.on("connection", (socket) => {
  socket.on("setup", (userData) => {
    if (userData && userData._id) {
      // 1. Όλοι μπαίνουν στο προσωπικό τους room
      socket.join(userData._id); 
      
      // 2. Οι Admins μπαίνουν στο room 'admins'
      if (userData.role === "admin") {
        socket.join("admins");
      }

      // 3. Οι Team Leaders μπαίνουν στο room του Project τους (π.χ. 'tl_nova')
      if (userData.role === "team leader" && userData.project) {
        socket.join(`tl_${userData.project.toLowerCase()}`);
      }
    }
  });

  socket.on("disconnect", () => {});
});

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    `${process.env.FRONTEND_URL}:3000`, 
    "http://localhost:3000"
  ]
}));

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", emailRoutes);
app.use("/api/login-logs", require("./routes/logs"));
app.use("/api/time", timeRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/tickets", ticketRoutes);

connectDB();

app.get("/", (req, res) => {
  res.send(`Profferio backend is running on ${process.env.FRONTEND_URL}`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  startCronJobs();
});

cron.schedule("*/1 * * * * *", async () => {
  try {
    await axios.post(`${process.env.INTERNAL_API_URL || 'http://localhost:' + PORT}/api/auth/force-close-inactive-sessions`);
  } catch (err) {}
});