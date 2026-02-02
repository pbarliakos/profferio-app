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

// User Schema (Strict: false για να περνάει τα πάντα)
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
  role: String,
  project: String,
  company: String
}, { strict: false });

const User = mongoose.model("User", userSchema);

async function importUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Συνδέθηκα στη βάση: ${mongoose.connection.name}`);

    const results = [];
    const csvPath = path.join(__dirname, "export-users.csv");
    const defaultHash = await bcrypt.hash("123456", 10);

    fs.createReadStream(csvPath)
      .pipe(csv({ 
        separator: ';', 
        mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, '').toLowerCase() 
      })) 
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        
        console.log(`📂 CSV Loaded: ${results.length} rows.`);
        let updateCount = 0;
        let successCount = 0;

        for (const row of results) {
          const fullName = row["full name"] || row["fullname"] || row["name"];
          const email = row["email"];
          const username = row["username"];
          const role = row["role"] || "user";
          const project = row["project"] || "other";
          
          // Force Company
          let company = row["company"];
          if (!company || company.trim() === "") company = "Othisi"; 

          // ✅ SAFE PASSWORD LOGIC (Για να μην σκάει το bcrypt)
          let passwordToSave = defaultHash;
          const rawPass = row["password"];
          
          if (rawPass && typeof rawPass === 'string' && rawPass.trim().length > 0) {
             try {
                passwordToSave = await bcrypt.hash(rawPass.trim(), 10);
             } catch (e) {
                console.log(`⚠️ Password error for ${username}, using default.`);
             }
          }

          if (!username || !email) continue;

          // Check if exists
          const existing = await User.findOne({ $or: [{ email }, { username }] });
          
          if (existing) {
            // FORCE UPDATE
            await User.updateOne(
                { _id: existing._id },
                { 
                    $set: { 
                        company: company,
                        project: project,
                        role: role,
                        fullName: fullName,
                        password: passwordToSave
                    } 
                }
            );
            process.stdout.write("."); // Print dot for progress
            updateCount++;
          } else {
            // CREATE
            await User.create({
              fullName, email, username, password: passwordToSave, role, project, company
            });
            console.log(`\n✅ Created: ${username}`);
            successCount++;
          }
        }

        console.log("\n------------------------------------------------");
        console.log(`✅ Νέοι: ${successCount}`);
        console.log(`🔄 Ενημερώθηκαν: ${updateCount}`);
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

importUsers();