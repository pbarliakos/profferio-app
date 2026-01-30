const TimeDaily = require("../models/TimeDaily");
const { DateTime } = require("luxon");

const TZ = "Europe/Athens";

// Helper: Βρίσκει ή δημιουργεί την εγγραφή της ημέρας
const getTodayDoc = async (userId) => {
  const now = DateTime.now().setZone(TZ);
  const dateKey = now.toFormat("yyyy-MM-dd");

  let doc = await TimeDaily.findOne({ userId, dateKey });
  
  if (!doc) {
    // Δημιουργία νέας εγγραφής στη μνήμη (δεν σώζουμε ακόμα)
    doc = new TimeDaily({
      userId,
      dateKey,
      status: "CLOSED",
      storedWorkMs: 0,
      storedBreakMs: 0,
      logs: []
    });
  }
  return doc;
};

// GET: Φέρνει την κατάσταση της ημέρας
exports.getTodayStatus = async (req, res) => {
  try {
    // Το protect middleware βάζει το user στο req.user
    if (!req.user || !req.user._id) {
        return res.status(401).json({ error: "User not authenticated correctly" });
    }

    const doc = await getTodayDoc(req.user._id);
    res.json(doc);
  } catch (err) {
    console.error("Error in getTodayStatus:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST: Διαχειρίζεται τα κουμπιά (START, BREAK, RESUME, STOP)
exports.handleAction = async (req, res) => {
  try {
    const { action } = req.body; // "START", "BREAK", "RESUME", "STOP"
    const userId = req.user._id;
    const now = new Date();
    
    let doc = await getTodayDoc(userId);
    
    // Υπολογισμός χρόνου που πέρασε από την τελευταία ενέργεια
    let elapsed = 0;
    if (doc.lastActionAt) {
      elapsed = now.getTime() - new Date(doc.lastActionAt).getTime();
    }

    // --- LOGIC ---
    if (action === "START") {
      // Έναρξη ημέρας ή Επανανοιγμα
      doc.status = "WORKING";
      doc.lastActionAt = now;
      if (!doc.firstLoginAt) doc.firstLoginAt = now; 
    } 
    
    else if (action === "BREAK") {
      // Από Working σε Break
      if (doc.status === "WORKING") {
        doc.storedWorkMs += elapsed; 
        doc.status = "BREAK";
        doc.lastActionAt = now;
      }
    } 
    
    else if (action === "RESUME") {
      // Από Break σε Working
      if (doc.status === "BREAK") {
        doc.storedBreakMs += elapsed;
        doc.status = "WORKING";
        doc.lastActionAt = now;
      }
    } 
    
    else if (action === "STOP") {
      // Τέλος ημέρας (ή logout)
      if (doc.status === "WORKING") {
        doc.storedWorkMs += elapsed;
      } else if (doc.status === "BREAK") {
        doc.storedBreakMs += elapsed;
      }
      doc.status = "CLOSED";
      doc.lastLogoutAt = now;
      doc.lastActionAt = now; 
    }

    // Προσθήκη στο log
    doc.logs.push({ action, timestamp: now });
    
    await doc.save();
    res.json(doc);

  } catch (err) {
    console.error("Error in handleAction:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET: Ιστορικό με φίλτρο μήνα
exports.getHistory = async (req, res) => {
  try {
    const { month } = req.query; // Format "YYYY-MM"
    const userId = req.user._id;

    const query = { userId };
    if (month) {
      query.dateKey = { $regex: `^${month}` };
    }

    const logs = await TimeDaily.find(query).sort({ dateKey: -1 });
    res.json(logs);
  } catch (err) {
    console.error("Error in getHistory:", err);
    res.status(500).json({ error: err.message });
  }
};