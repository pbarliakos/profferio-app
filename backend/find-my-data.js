require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

// Ορίζουμε το Schema απλά για να διαβάσουμε
const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));

async function findData() {
  try {
    console.log("------------------------------------------------");
    console.log("🔍 Ψάχνω να βρω πού κρύβονται οι χρήστες...");
    console.log(`🔌 URI από .env: ${MONGO_URI}`);
    
    await mongoose.connect(MONGO_URI);
    
    console.log(`🗄️  Συνδέθηκα στη βάση: "${mongoose.connection.name}"`); // ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΚΛΕΙΔΙ
    
    const count = await User.countDocuments();
    console.log(`📊 Πλήθος χρηστών σε αυτή τη βάση: ${count}`);
    
    if (count > 0) {
        const oneUser = await User.findOne();
        console.log("👤 Παράδειγμα χρήστη:", oneUser.username, "| Company:", oneUser.company);
    } else {
        console.log("❌ Η βάση αυτή είναι ΑΔΕΙΑ. Τα δεδομένα είναι αλλού!");
    }
    
    console.log("------------------------------------------------");
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

findData();