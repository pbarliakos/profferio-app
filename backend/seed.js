const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User"); // Βεβαιώσου ότι η διαδρομή για το μοντέλο User είναι σωστή

dotenv.config();

const seedAdmin = async () => {
  try {
    // 1. Σύνδεση στη βάση (χρησιμοποιεί το MONGO_URI από το .env σου)
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // 2. Έλεγχος αν υπάρχει ήδη ο χρήστης
    const existingUser = await User.findOne({ username: "admin" });
    if (existingUser) {
      console.log("User 'admin' already exists. Skipping...");
      process.exit();
    }

    // 3. Δημιουργία κωδικού (Hashing)
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // 4. Δημιουργία του χρήστη
    const adminUser = new User({
      username: "adminstg",
      password: hashedPassword,
      fullName: "Administrator Stg",
      email: "adminstg@profferio.gr",
      role: "admin",
      project: "admin" // Ή όποιο project θέλεις να έχει πρόσβαση
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log("Username: adminstg");
    console.log("Password: admin123");

    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
    process.exit(1);
  }
};

seedAdmin();