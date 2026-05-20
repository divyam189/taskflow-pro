const prisma = require("../config/db");

const createFocusSession = async (req, res) => {
  const { taskId, type = "WORK", durationMinutes = 25 } = req.body;

  if (taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true } } },
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    const canAccess =
      req.user.role === "ADMIN" ||
      task.project.createdById === req.user.id ||
      task.assignedTo === req.user.id ||
      task.project.members.some((m) => m.userId === req.user.id);
    if (!canAccess) return res.status(403).json({ message: "Forbidden" });
  }

  const session = await prisma.focusSession.create({
    data: {
      userId: req.user.id,
      taskId: taskId || null,
      type: type === "BREAK" ? "BREAK" : "WORK",
      durationMinutes: Number(durationMinutes) || 25,
    },
    include: {
      task: { select: { id: true, title: true } },
    },
  });

  res.status(201).json({ session });
};

const getFocusHistory = async (req, res) => {
  const sessions = await prisma.focusSession.findMany({
    where: { userId: req.user.id },
    include: { task: { select: { id: true, title: true } } },
    orderBy: { completedAt: "desc" },
    take: 50,
  });
  res.json({ sessions });
};

const getFocusStats = async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todaySessions, allWorkSessions, streakDays] = await Promise.all([
    prisma.focusSession.findMany({
      where: { userId: req.user.id, type: "WORK", completedAt: { gte: startOfDay } },
    }),
    prisma.focusSession.findMany({
      where: { userId: req.user.id, type: "WORK" },
      select: { completedAt: true, durationMinutes: true },
      orderBy: { completedAt: "desc" },
      take: 200,
    }),
    prisma.focusSession.groupBy({
      by: ["completedAt"],
      where: { userId: req.user.id, type: "WORK" },
    }),
  ]);

  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPomodoros = allWorkSessions.length;
  const totalFocusMinutes = allWorkSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  const daySet = new Set(
    allWorkSessions.map((s) => new Date(s.completedAt).toISOString().slice(0, 10))
  );

  res.json({
    todayMinutes,
    todayPomodoros: todaySessions.length,
    totalPomodoros,
    totalFocusMinutes,
    activeDays: daySet.size,
  });
};

module.exports = { createFocusSession, getFocusHistory, getFocusStats };
