const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", async (req, res) => {
  const { username } = req.body;

  res.json({ message: "Logged out" });
});
module.exports = router;
