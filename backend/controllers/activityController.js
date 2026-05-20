const prisma = require("../config/db");

const getActivities = async (req, res) => {
  const logs = await prisma.activityLog.findMany({
    where: req.user.role === "ADMIN" ? {} : { userId: req.user.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ activities: logs });
};

module.exports = { getActivities };
