const prisma = require("../config/db");

const getNotifications = async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json({ notifications });
};

const markNotificationRead = async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ message: "Notification not found" });
  }
  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });
  res.json({ message: "Notification marked as read", notification: updated });
};

module.exports = { getNotifications, markNotificationRead };
