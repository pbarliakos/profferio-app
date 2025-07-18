const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const emailRoutes = require("./routes/emailRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({origin: "http://localhost:3000"}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", emailRoutes);


connectDB();


app.get("/", (req, res) => {
  res.send("Profferio backend is running");
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
})

app.use("/api/users", userRoutes);