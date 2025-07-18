const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { protect } = require("../middleware/auth"); // ✅ εισαγωγή
const NovaEmail = require("../models/NovaEmail");

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: "jira@othisisa.gr",
    pass: "YOUR_APP_PASSWORD",
  },
});

// 🛡️ Προστατευμένο route με καταγραφή χρήστη
router.post("/send-welcome-email", protect, async (req, res) => {
  const { email } = req.body;

  const mailOptions = {
    from: "jira@othisisa.gr",
    to: email,
    subject: "Καλωσόρισες στο Project Nova",
    html: `
      <p>Γεια σου και καλώς ήρθες στο <strong>Project Nova</strong>!</p>
      <p>Σύντομα θα επικοινωνήσουμε μαζί σου.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);

    await NovaEmail.create({
      email,
      byUser: req.user.username, // ✅ Καταγραφή του αποστολέα
    });

    res.status(200).json({ message: "Email sent" });
  } catch (err) {
    console.error("❌ Σφάλμα αποστολής:", err);
    res.status(500).json({ error: "Αποτυχία αποστολής", details: err.message });
  }
});
