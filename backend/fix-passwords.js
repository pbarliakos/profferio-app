require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const csv = require("csv-parser");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Δεν βρέθηκε MONGO_URI στο .env αρχείο.");
  process.exit(1);
}

// User Schema (Strict false)
const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));

async function fixPasswords() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Συνδέθηκε στη βάση: ${mongoose.connection.name}`);

    const results = [];
    const csvPath = path.join(__dirname, "export-users.csv");

    fs.createReadStream(csvPath)
      .pipe(csv({ 
        separator: ';', 
        mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, '').toLowerCase() 
      })) 
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        
        console.log(`📂 Έλεγχος ${results.length} χρηστών για διόρθωση κωδικών...`);
        let fixedCount = 0;

        for (const row of results) {
          const username = row["username"];
          const rawPassword = row["password"]; // Ο κωδικός όπως είναι στο Excel

          if (!username) continue;

          // Έλεγχος αν υπάρχει κωδικός στο Excel
          if (!rawPassword || rawPassword.trim() === "") {
              console.log(`⚠️ O χρήστης ${username} ΔΕΝ έχει κωδικό στο Excel. Αγνοήθηκε.`);
              continue;
          }

          const cleanPassword = rawPassword.trim(); // Καθαρίζουμε κενά

          // Βρίσκουμε τον χρήστη στη βάση
          const user = await User.findOne({ username });

          if (user) {
            // Κάνουμε hash τον ΣΩΣΤΟ κωδικό
            const hashedPassword = await bcrypt.hash(cleanPassword, 10);
            
            // Κάνουμε update μόνο τον κωδικό
            await User.updateOne(
                { _id: user._id },
                { $set: { password: hashedPassword } }
            );

            console.log(`🔐 FIXED: ${username} -> Password: "${cleanPassword}"`);
            fixedCount++;
          } else {
            console.log(`❌ Δεν βρέθηκε στη βάση: ${username}`);
          }
        }

        console.log("------------------------------------------------");
        console.log(`✅ Διορθώθηκαν ${fixedCount} κωδικοί.`);
        console.log("------------------------------------------------");
        
        mongoose.disconnect();
        process.exit(0);
      });

  } catch (err) {
    console.error("❌ Error:", err);
    mongoose.disconnect();
    process.exit(1);
  }
}

fixPasswords();