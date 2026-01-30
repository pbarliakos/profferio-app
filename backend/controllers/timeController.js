const TimeDaily = require("../models/TimeDaily");
const User = require("../models/User"); // Χρειαζόμαστε το User model για τα φίλτρα
const { DateTime } = require("luxon");

const TZ = "Europe/Athens";

// Helper: Βρίσκει ή δημιουργεί την εγγραφή της ημέρας
const getTodayDoc = async (userId) => {
  const now = DateTime.now().setZone(TZ);
  const dateKey = now.toFormat("yyyy-MM-dd");

  let doc = await TimeDaily.findOne({ userId, dateKey });
  
  if (!doc) {
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
    const { action } = req.body; 
    const userId = req.user._id;
    const now = new Date();
    
    let doc = await getTodayDoc(userId);
    
    let elapsed = 0;
    if (doc.lastActionAt) {
      elapsed = now.getTime() - new Date(doc.lastActionAt).getTime();
    }

    if (action === "START") {
      doc.status = "WORKING";
      doc.lastActionAt = now;
      if (!doc.firstLoginAt) doc.firstLoginAt = now; 
    } 
    else if (action === "BREAK") {
      if (doc.status === "WORKING") {
        doc.storedWorkMs += elapsed; 
        doc.status = "BREAK";
        doc.lastActionAt = now;
      }
    } 
    else if (action === "RESUME") {
      if (doc.status === "BREAK") {
        doc.storedBreakMs += elapsed;
        doc.status = "WORKING";
        doc.lastActionAt = now;
      }
    } 
    else if (action === "STOP") {
      if (doc.status === "WORKING") {
        doc.storedWorkMs += elapsed;
      } else if (doc.status === "BREAK") {
        doc.storedBreakMs += elapsed;
      }
      doc.status = "CLOSED";
      doc.lastLogoutAt = now;
      doc.lastActionAt = now; 
    }

    doc.logs.push({ action, timestamp: now });
    await doc.save();
    res.json(doc);

  } catch (err) {
    console.error("Error in handleAction:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET: Ιστορικό User
exports.getHistory = async (req, res) => {
  try {
    const { month } = req.query;
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

// --- ADMIN FUNCTIONS ---

exports.getActiveUsers = async (req, res) => {
  try {
    const users = await User.find({}, "fullName _id project role company").sort({ fullName: 1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllLogs = async (req, res) => {
  try {
    const { startDate, endDate, userIds, roles, projects, companies } = req.query;
    
    let query = {};

    // 1. Φίλτρο Ημερομηνίας
    if (startDate && endDate) {
       query.dateKey = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
       query.dateKey = { $gte: startDate }; 
    } else {
       // Default τρέχων μήνας
       const startOfMonth = DateTime.now().setZone(TZ).startOf('month').toFormat("yyyy-MM-dd");
       query.dateKey = { $gte: startOfMonth };
    }

    // 2. Σύνθετο Φίλτρο Χρηστών (Role, Project, Company)
    // Πρέπει να βρούμε τα IDs των χρηστών που ταιριάζουν στα κριτήρια
    let userCriteria = {};
    let needsUserFilter = false;

    if (roles && roles !== "all") {
        userCriteria.role = { $in: roles.split(",") };
        needsUserFilter = true;
    }
    if (projects && projects !== "all") {
        userCriteria.project = { $in: projects.split(",") };
        needsUserFilter = true;
    }
    if (companies && companies !== "all") {
        userCriteria.company = { $in: companies.split(",") };
        needsUserFilter = true;
    }

    let allowedUserIds = [];
    
    // Αν έχουμε φίλτρα ιδιοτήτων, βρίσκουμε τα userIds
    if (needsUserFilter) {
        const matchingUsers = await User.find(userCriteria).select("_id");
        allowedUserIds = matchingUsers.map(u => u._id);
    }

    // 3. Συνδυασμός με το φίλτρο συγκεκριμένων χρηστών (Dropdown Users)
    if (userIds && userIds !== "all") {
        const specificIds = userIds.split(",");
        
        if (needsUserFilter) {
            // Τομή συνόλων: Πρέπει να είναι ΚΑΙ στη λίστα επιλογής ΚΑΙ να ταιριάζει στα φίλτρα
            // (Εδώ κάνουμε απλά override: αν διάλεξε συγκεκριμένους χρήστες, συνήθως θέλει αυτούς)
            // Αλλά για σωστό filtering ας πούμε ότι υπερισχύει το specific selection ή κάνουμε intersection.
            // Απλοποίηση: Αν διαλέξει users, ψάχνουμε αυτούς. Αν όχι, ψάχνουμε τα allowedUserIds.
            query.userId = { $in: specificIds };
        } else {
            query.userId = { $in: specificIds };
        }
    } else if (needsUserFilter) {
        // Αν δεν διάλεξε συγκεκριμένους users αλλά έβαλε φίλτρα (π.χ. Role: Admin)
        query.userId = { $in: allowedUserIds };
    }


    const logs = await TimeDaily.find(query)
      .populate("userId", "fullName username role project company")
      .sort({ dateKey: -1 });

    // Υπολογισμός Live χρόνων
    const processedLogs = logs.map(doc => {
        const log = doc.toObject();
        // Fallback αν σβήστηκε ο χρήστης, να μην σκάει
        if (!log.userId) log.userId = {}; 

        if (log.status === "WORKING" && log.lastActionAt) {
             const now = new Date().getTime();
             const elapsed = now - new Date(log.lastActionAt).getTime();
             log.workingMs = (log.storedWorkMs || 0) + elapsed; 
             log.breakMs = log.storedBreakMs || 0;
        } else if (log.status === "BREAK" && log.lastActionAt) {
             const now = new Date().getTime();
             const elapsed = now - new Date(log.lastActionAt).getTime();
             log.workingMs = log.storedWorkMs || 0;
             log.breakMs = (log.storedBreakMs || 0) + elapsed;
        } else {
             log.workingMs = log.storedWorkMs || 0;
             log.breakMs = log.storedBreakMs || 0;
        }
        log.totalPresenceMs = log.workingMs + log.breakMs;
        return log;
    });

    res.json({ logs: processedLogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, storedWorkMs, storedBreakMs, dateKey, firstLoginAt, lastLogoutAt } = req.body;

    const log = await TimeDaily.findById(id);
    if (!log) return res.status(404).json({ message: "Log not found" });

    log.status = status;
    log.storedWorkMs = storedWorkMs;
    log.storedBreakMs = storedBreakMs;
    log.dateKey = dateKey;
    
    if (firstLoginAt) log.firstLoginAt = new Date(firstLoginAt);
    if (lastLogoutAt) log.lastLogoutAt = new Date(lastLogoutAt);

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