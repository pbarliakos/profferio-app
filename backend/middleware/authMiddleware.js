const jwt = require("jsonwebtoken");
const User = require("../models/User");
const LoginLog = require("../models/LoginLog"); // ✅ Import για έλεγχο session

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select("-password");
      if (!req.user) return res.status(401).json({ message: "User not found" });

      // ✅ SECURITY CHECK: Ελέγχουμε αν υπάρχει ενεργό session στη βάση
      // Αν κάναμε Force Logout, δεν θα υπάρχει κανένα ανοιχτό session, άρα θα τον πετάξει.
      const activeSession = await LoginLog.findOne({
        userId: req.user._id,
        logoutAt: { $exists: false }
      });

      if (!activeSession) {
         return res.status(401).json({ message: "Session expired or force logged out." });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
};

module.exports = { protect, isAdmin };