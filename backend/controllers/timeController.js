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

// ... (τα υπόλοιπα imports και functions παραμένουν ως έχουν)
const User = require("../models/User"); // Βεβαιώσου ότι έχεις κάνει import το User

// --- ADMIN FUNCTIONS ---

// 1. Λήψη όλων των χρηστών (για το dropdown)
exports.getActiveUsers = async (req, res) => {
  try {
    const users = await User.find({}, "fullName _id project").sort({ fullName: 1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Λήψη Logs με φίλτρα
exports.getAllLogs = async (req, res) => {
  try {
    const { startDate, endDate, userIds } = req.query;
    
    let query = {};

    // Φίλτρο Ημερομηνίας
    if (startDate && endDate) {
       query.dateKey = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
       query.dateKey = { $gte: startDate }; // Από μια ημ/νια και μετά
    } else {
       // Default: Τρέχων μήνας αν δεν επιλέξει τίποτα (για να μην κρασάρει από όγκο δεδομένων)
       const startOfMonth = DateTime.now().setZone(TZ).startOf('month').toFormat("yyyy-MM-dd");
       query.dateKey = { $gte: startOfMonth };
    }

    // Φίλτρο Χρηστών
    if (userIds && userIds !== "all") {
      const idsArray = userIds.split(",");
      query.userId = { $in: idsArray };
    }

    const logs = await TimeDaily.find(query)
      .populate("userId", "fullName username role project")
      .sort({ dateKey: -1 }); // Φθίνουσα ταξινόμηση (νεότερα πρώτα)

    // Υπολογισμός τελικών χρόνων (αν κάποιος είναι ακόμα Working, προσθέτουμε τον χρόνο που πέρασε)
    const processedLogs = logs.map(doc => {
        const log = doc.toObject();
        if (log.status === "WORKING" && log.lastActionAt) {
             const now = new Date().getTime();
             const elapsed = now - new Date(log.lastActionAt).getTime();
             log.workingMs = (log.storedWorkMs || 0) + elapsed; // Προσωρινός υπολογισμός για εμφάνιση
             log.breakMs = log.storedBreakMs || 0;
             log.totalPresenceMs = log.workingMs + log.breakMs;
        } else if (log.status === "BREAK" && log.lastActionAt) {
             const now = new Date().getTime();
             const elapsed = now - new Date(log.lastActionAt).getTime();
             log.workingMs = log.storedWorkMs || 0;
             log.breakMs = (log.storedBreakMs || 0) + elapsed;
             log.totalPresenceMs = log.workingMs + log.breakMs;
        } else {
             // Closed logs
             log.workingMs = log.storedWorkMs || 0;
             log.breakMs = log.storedBreakMs || 0;
             log.totalPresenceMs = log.workingMs + log.breakMs;
        }
        return log;
    });

    res.json({ logs: processedLogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// 3. Update Log (Edit από Admin)
exports.updateLog = async (req, res) => {
  try {
    const { id } = req.params;
    // Προσθέσαμε τα firstLoginAt και lastLogoutAt
    const { status, storedWorkMs, storedBreakMs, dateKey, firstLoginAt, lastLogoutAt } = req.body;

    const log = await TimeDaily.findById(id);
    if (!log) return res.status(404).json({ message: "Log not found" });

    log.status = status;
    log.storedWorkMs = storedWorkMs;
    log.storedBreakMs = storedBreakMs;
    log.dateKey = dateKey;
    
    // ✅ Ενημέρωση των timestamps (αν υπάρχουν)
    if (firstLoginAt) log.firstLoginAt = new Date(firstLoginAt);
    if (lastLogoutAt) log.lastLogoutAt = new Date(lastLogoutAt);

    // Αν γυρίσει σε CLOSED, κλείνουμε τα actions
    if (status === "CLOSED") {
        log.lastActionAt = new Date(); 
    }

    log.logs.push({ 
        action: "ADMIN_EDIT", 
        timestamp: new Date(), 
        details: `Updated by Admin` 
    });

    await log.save();
    res.json(log);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};