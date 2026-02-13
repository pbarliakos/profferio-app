const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Βεβαιωνόμαστε ότι ο φάκελος υπάρχει
const uploadDir = "uploads/tickets";
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Ρύθμιση αποθήκευσης
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Μοναδικό όνομα: timestamp-originalName
    // Χρησιμοποιούμε Buffer για να διαβάσουμε σωστά τα ελληνικά ονόματα αρχείων αν χρειαστεί
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Φίλτρο αρχείων (Ποια επιτρέπονται)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Μη επιτρεπόμενος τύπος αρχείου. Επιτρέπονται: Εικόνες, PDF, Office Docs, TXT."));
  }
};

// Όριο μεγέθους (π.χ. 5MB)
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

module.exports = upload;