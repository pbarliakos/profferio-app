require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User"); // Βεβαιώσου ότι το path είναι σωστό

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Δεν βρέθηκε MONGO_URI στο .env αρχείο.");
  process.exit(1);
}

async function normalizeUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Συνδέθηκε στη βάση: ${mongoose.connection.name}`);

    const users = await User.find({});
    console.log(`🔍 Βρέθηκαν ${users.length} χρήστες. Έλεγχος για κεφαλαία...`);

    let updatedCount = 0;

    for (const user of users) {
      let changed = false;

      // 1. Διόρθωση ROLE (σε μικρά)
      if (user.role && user.role !== user.role.toLowerCase()) {
        console.log(`   ✏️ Role change for ${user.username}: ${user.role} -> ${user.role.toLowerCase()}`);
        user.role = user.role.toLowerCase();
        changed = true;
      }

      // 2. Διόρθωση PROJECT (σε μικρά)
      if (user.project && user.project !== user.project.toLowerCase()) {
        console.log(`   ✏️ Project change for ${user.username}: ${user.project} -> ${user.project.toLowerCase()}`);
        user.project = user.project.toLowerCase();
        changed = true;
      }

      // 3. Διόρθωση COMPANY (αν θες και αυτό σε μικρά ή απλά Trim)
      // Εδώ συνήθως τα ονόματα εταιρειών τα θέλουμε με κεφαλαίο το πρώτο (π.χ. Othisi), οπότε δεν το πειράζω σε lowercase,
      // απλά αφαιρώ κενά αν υπάρχουν.
      if (user.company) {
          const trimmed = user.company.trim();
          if (user.company !== trimmed) {
              user.company = trimmed;
              changed = true;
          }
      }

      if (changed) {
        await user.save();
        updatedCount++;
      }
    }

    console.log("------------------------------------------------");
    console.log(`✅ Ολοκληρώθηκε! Ενημερώθηκαν ${updatedCount} χρήστες.`);
    console.log("------------------------------------------------");
    
    mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error("❌ Error:", err);
    mongoose.disconnect();
    process.exit(1);
  }
}

normalizeUsers();