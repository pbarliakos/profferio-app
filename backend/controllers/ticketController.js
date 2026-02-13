const Ticket = require("../models/Ticket");
const User = require("../models/User");

// ✅ 1. CREATE TICKET -> Notification μόνο στους Admins
exports.createTicket = async (req, res) => {
  try {
    const { subject, category, description, priority } = req.body;
    
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => file.path.replace(/\\/g, "/")); 
    }

    const newTicket = new Ticket({
      createdBy: req.user._id,
      project: req.user.project, 
      category,
      subject,
      description,
      priority: priority || "Medium",
      attachments,
      history: [
        {
          action: "CREATED",
          user: req.user._id,
          userName: req.user.fullName,
          details: "Ticket created",
          timestamp: new Date()
        }
      ]
    });

    await newTicket.save();

    // ✅ Rule: Create -> Notify ONLY Admins
    const io = req.app.get("io");
    io.to("admins").emit("ticket_notification", {
        title: "Νέο Ticket",
        message: `${req.user.fullName} (${req.user.project}) δημιούργησε νέο ticket: ${subject}`,
        ticketId: newTicket._id,
        senderId: req.user._id, // Για να μην χτυπήσει στον ίδιο αν είναι admin
        type: "info"
    });

    res.status(201).json(newTicket);
  } catch (err) {
    console.error("Create Ticket Error:", err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
};

// ✅ 2. GET TICKETS
exports.getTickets = async (req, res) => {
  try {
    let query = {};
    const { status, category } = req.query;

    if (req.user.role === "admin") {
        // Admin sees all
    } else if (req.user.role === "team leader") {
        query.project = req.user.project;
    } else {
        query.createdBy = req.user._id;
    }

    if (status && status !== "All") query.status = status;
    if (category && category !== "All") query.category = category;

    const tickets = await Ticket.find(query)
      .populate("createdBy", "fullName username project")
      .populate("assignedTo", "fullName")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

// ✅ 3. GET SINGLE TICKET
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("createdBy", "fullName role email")
      .populate("history.user", "fullName role")
      .populate('assignedTo', 'fullName email');

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (req.user.role !== "admin" && req.user.role !== "team leader" && ticket.createdBy._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Not authorized" });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ 4. UPDATE / REPLY TICKET
exports.updateTicket = async (req, res) => {
  try {
    const { status, priority, comment, isInternal } = req.body;
    const ticket = await Ticket.findById(req.params.id).populate("createdBy"); 

    if (!ticket) return res.status(404).json({ error: "Not found" });

    let newFiles = [];
    if (req.files && req.files.length > 0) {
      newFiles = req.files.map(file => file.path.replace(/\\/g, "/"));
    }

    const senderRole = req.user.role;
    const isAgent = senderRole === "admin" || senderRole === "team leader";
    
    // ✅ Μετατροπή string "true" σε boolean (ΣΗΜΑΝΤΙΚΟ)
    const internalNote = (isInternal === "true" || isInternal === true);

    let newStatus = status;

    // Αν είναι Internal Note, ΔΕΝ αλλάζουμε status αυτόματα για τον πελάτη
    if (!internalNote && (comment || newFiles.length > 0) && !status) {
        if (isAgent) {
            if (ticket.status !== "Closed") newStatus = "Reply by IT";
            if (!ticket.assignedTo) ticket.assignedTo = req.user._id;
        } else {
            if (ticket.status !== "Closed") newStatus = "Waiting for Reply";
        }
    }

    // Status Change
    if (newStatus && newStatus !== ticket.status) {
      ticket.history.push({
        action: "STATUS_CHANGE",
        user: req.user._id,
        userName: req.user.fullName,
        details: `Status changed from ${ticket.status} to ${newStatus}`,
        timestamp: new Date()
      });
      ticket.status = newStatus;

      if (isAgent && ["Assigned", "In Progress", "Scheduled", "Reply by IT"].includes(newStatus)) {
          ticket.assignedTo = req.user._id;
      }
    }

    // Priority Change
    if (priority && priority !== ticket.priority && isAgent) {
       ticket.priority = priority;
    }

    // Comment / Internal Note
    if (comment || newFiles.length > 0) {
      ticket.history.push({
        action: internalNote ? "INTERNAL_NOTE" : "COMMENT",
        user: req.user._id,
        userName: req.user.fullName,
        details: comment || "Attached files",
        files: newFiles,
        isInternal: internalNote, // ✅ Εδώ αποθηκεύεται το flag
        timestamp: new Date()
      });
    }

    await ticket.save();

    // ✅ NOTIFICATIONS: Αν είναι Internal, ΜΗΝ ειδοποιείς τον User
    if (!internalNote) {
        const io = req.app.get("io");
        const projectRoom = `tl_${ticket.project.toLowerCase()}`;
        const creatorId = ticket.createdBy._id.toString();
        const notificationData = {
            title: `Ενημέρωση στο Ticket #${ticket.ticketId}`,
            message: `O/H ${req.user.fullName} ενημέρωσε το ticket: ${ticket.subject}`,
            ticketId: ticket._id,
            senderId: req.user._id, 
            type: "info"
        };

        if (senderRole === "admin") {
            io.to(creatorId).emit("ticket_notification", { ...notificationData, type: "success" });
            io.to(projectRoom).emit("ticket_notification", notificationData);
        } else {
            io.to("admins").emit("ticket_notification", { ...notificationData, type: "warning" });
            if (req.user._id.toString() !== creatorId) {
                io.to(creatorId).emit("ticket_notification", notificationData);
            }
            io.to(projectRoom).emit("ticket_notification", notificationData);
        }
    }

    const updatedTicket = await Ticket.findById(req.params.id)
        .populate("createdBy", "fullName")
        .populate("assignedTo", "fullName")
        .populate("history.user", "fullName role");

    res.json(updatedTicket);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};