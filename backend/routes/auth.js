const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", async (req, res) => {
  const { username } = req.body;

  await Log.create({
    adminUsername: username,
    action: "logout",
    targetUser: username,
  });

  res.json({ message: "Logged out" });
});
module.exports = router;
