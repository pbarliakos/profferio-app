router.get("/logs", protect, isAdmin, async (req, res) => {
  const logs = await Log.find().sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});
