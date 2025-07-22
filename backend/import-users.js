require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const csv = require("csv-parser");

// MongoDB URI from .env
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Δεν βρέθηκε MONGO_URI στο .env αρχείο.");
  process.exit(1);
}

// User schema
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
  role: String,
  project: String,
});

const User = mongoose.model("User", userSchema);

async function importUsers() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Συνδέθηκε στη MongoDB");

  const results = [];

  fs.createReadStream(path.join(__dirname, "export-users.csv"))
    .pipe(csv({ separator: ";" }))
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      for (const userData of results) {
        const { fullName, email, username, password, role, project } = userData;

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
          console.log(`⏭️ Υπάρχει ήδη: ${username}`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
          fullName,
          email,
          username,
          password: hashedPassword,
          role,
          project,
        });

        await newUser.save();
        console.log(`✅ Προστέθηκε: ${username}`);
      }

      console.log("🎉 Ολοκληρώθηκε η εισαγωγή χρηστών.");
      mongoose.disconnect();
    });
}

importUsers().catch((err) => {
  console.error("❌ Σφάλμα:", err);
  mongoose.disconnect();
});
