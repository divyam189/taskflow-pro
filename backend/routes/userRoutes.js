const express = require("express");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const prisma = require("../config/db");

const router = express.Router();

router.get("/", protect, allowRoles("ADMIN"), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users });
});

module.exports = router;
