const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { protect } = require("../middleware/authMiddleware");
const NovaEmail = require("../models/NovaEmail");
const { Parser } = require("json2csv");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const path = require("path");
require('dotenv').config();

dayjs.extend(utc);
dayjs.extend(timezone);




const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: "info@novasales.gr", // email
    pass: process.env.EMAIL_PASS, // ⚠️ Χρησιμοποίησε App Password εδώ
  },
});





// ✅ ΜΟΝΟ μία φορά αυτό το route, με protect
router.post("/send-welcome-email", protect, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const mailOptions = {
    from: "info@novasales.gr",
    to: email,
    subject: "NOVA - Οδηγίες για Gigabit Κουπόνι",
    html: `
      <h2>Οδηγίες έκδοσης κουπονιού για Gigabit Δράση:</h2>
      <br><br>
      <br><br>
      <b>Βήμα 1ο:</b> Επισκεφθείτε την σελίδα 
      <a href="https://gigabit-voucher.gov.gr/go-beyond/login">https://gigabit-voucher.gov.gr/go-beyond/login</a> 
      και επιλέξτε Είσοδο με διαπιστευτήρια  TAXISnet.
      <br><br>
      <img src="cid:step1@profferio" />
      <br><br>
      <br><br>
      <b>Βήμα 2ο:</b> Πληκτρολογήστε τους προσωπικούς σας TAXISnet (Username & Password) και επιλέξτε Σύνδεση.
      <br><br>
      <img src="cid:step2@profferio" />
      <br><br>
      <br><br>

      <b>Βήμα 3ο:</b> Εμφανίζεται η Αυθεντικοποίηση Χρήστη και επιλέγετε Αποστολή.
      <br><br>
      <img src="cid:step3@profferio" />
      <br><br>
      <br><br>

      <b>Βήμα 4ο:</b> Στην σελίδα που εμφανίζεται θα πατήσετε πάνω αριστερά στην "Δημιουργία Αίτησης".
      <br><br>
      <img src="cid:step4@profferio" />
      <br><br>
      <br><br>

      <b>Βήμα 5ο:</b> Πληκτρολογείτε στην μπάρα αναζήτησης ολόκληρη τη διεύθυνση και επιλέγετε το κτίριο.
      <br><br>
      <img src="cid:step5.1@profferio" />
      <br><br>
      <img src="cid:step5.2@profferio" />
      <br><br>
      <br><br>

      <b>Βήμα 6ο:</b> Συμπληρώνετε Αριθμό Ταυτότητας, Ημερομηνία Γέννησης, Κινητό, Email.
      <br><br>
      <img src="cid:step6@profferio" />
      <br><br>
      <br><br>

      <b>Βήμα 7ο:</b> Θα προχωρήσετε σε  επαλήθευση του Αριθμού ΤΗΛ. και Email με τους μοναδικούς αριθμούς (OTP) που θα λάβετε με sms στο κινητό σας.
      <br><br>
      <img src="cid:step7.1@profferio" />
      <br><br>
      <img src="cid:step7.2@profferio" />
      <br><br>
      <br><br>

      <b>Βήμα 8ο:</b> Επιλέγετε αν υπάρχει υφιστάμενη σύνδεση ή νέα.
      <br><br>
      <img src="cid:step8@profferio" />
      <br><br>
      <br><br>

      <b>Βήμα 9ο:</b> Ανεβάζετε  λογαριασμό τελευταίου 2μήνου (εάν πρόκειται για υφιστάμενη/ενεργή σύνδεση).
      <br><br>
      <img src="cid:step9@profferio" />
      <br><br>
      <br><br>

      <b>Βήμα 10ο:</b> Αποδέχεστε τους όρους και προχωράτε σε Υποβολή.
      <br><br>
      <img src="cid:step10.1@profferio" />
      <br><br>
      <img src="cid:step10.2@profferio" />
      <br><br>
      <br><br>

      <b>Βήμα 11ο:</b> Επιβεβαιώνετε την υποβολή μέσω popup.
      <br><br>
      <img src="cid:step11.1@profferio" />
      <br><br>
      <img src="cid:step11.2@profferio" />
      <br><br>

      <p>Με την Υποβολή, δημιουργείται ο μοναδικός κωδικός του Voucher, ο οποίος αποστέλλεται με Email και SMS.</p>
      <br><br>
      <p><strong>ΠΡΟΣΟΧΗ:</strong> Αν οι έλεγχοι αποτύχουν, η αίτηση απορρίπτεται και πρέπει να υποβληθεί ξανά.</p>
      <br><br>
    `,
attachments: [
  ...[
    "step1", "step2", "step3", "step4",
    "step5.1", "step5.2",
    "step6",
    "step7.1", "step7.2",
    "step8", "step9",
    "step10.1", "step10.2",
    "step11.1", "step11.2"
  ].map(name => ({
    filename: `${name}.png`,
    path: path.join(__dirname, "..", "mailtmp", `${name}.png`),
    cid: `${name}@profferio`
  }))
]
 };


      const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);

  await NovaEmail.create({
    email,
    byUser: req.user.username,
  });

  res.status(200).json({ message: "Email sent and saved" });
});

// GET /api/email-history
router.get("/email-history/me", protect, async (req, res) => {
  try {
    const history = await NovaEmail.find({ byUser: req.user.username }).sort({ sentAt: -1 });
    res.json(history);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ message: "Failed to fetch email history" });
  }
});

// GET /api/email-history/export
router.get("/email-history/export", protect, async (req, res) => {
  try {
    const history = await NovaEmail.find({ byUser: req.user.username });

    const fields = ["email", "sentAt", "byUser"];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(history);

    res.header("Content-Type", "text/csv");
    res.attachment("nova-emails.csv");
    res.send(csv);
  } catch (err) {
    console.error("❌ CSV Export error:", err);
    res.status(500).json({ message: "Failed to export CSV" });
  }
});

// GET /api/email-history/export
router.get("/email-history", protect, async (req, res) => {
  const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;
  const skip = (page - 1) * limit;

  const filter = { byUser: req.user.username };

  if (search) {
    filter.email = { $regex: search, $options: "i" };
  }

if (startDate && endDate) {
  const start = dayjs(startDate).tz("Europe/Athens").startOf("day").toDate();
  const end = dayjs(endDate).tz("Europe/Athens").endOf("day").toDate();
  filter.sentAt = { $gte: start, $lte: end };
}


  const total = await NovaEmail.countDocuments(filter);
  const data = await NovaEmail.find(filter)
    .sort({ sentAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({
    data,
    total,
    totalPages: Math.ceil(total / limit),
    page: Number(page),
  });
});




module.exports = router;
