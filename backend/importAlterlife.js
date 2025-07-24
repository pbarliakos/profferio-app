const mongoose = require("mongoose");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/AlterlifeCustomer");

const data = JSON.parse(fs.readFileSync("alterlife_customers.json", "utf-8"));

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    await Customer.deleteMany(); // Προαιρετικό - καθαρίζει την παλιά συλλογή
    await Customer.insertMany(data);
    console.log("✅ Data imported successfully");
  } catch (err) {
    console.error("❌ Import failed:", err);
  } finally {
    process.exit();
  }
});