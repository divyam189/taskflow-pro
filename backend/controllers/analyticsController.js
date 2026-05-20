const prisma = require("../config/db");

const scopedTaskWhere = (user) =>
  user.role === "ADMIN"
    ? {}
    : {
        OR: [
          { assignedTo: user.id },
          { project: { createdById: user.id } },
          { project: { members: { some: { userId: user.id } } } },
        ],
      };

const scopedProjectWhere = (user) =>
  user.role === "ADMIN"
    ? {}
    : {
        OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }],
      };

const getAdvancedAnalytics = async (req, res) => {
  const taskWhere = scopedTaskWhere(req.user);
  const projectWhere = scopedProjectWhere(req.user);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    priorityGroups,
    tasksByAssignee,
    projects,
    weeklyCompleted,
  ] = await Promise.all([
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({ where: { ...taskWhere, status: "COMPLETED" } }),
    prisma.task.count({ where: { ...taskWhere, NOT: { status: "COMPLETED" } } }),
    prisma.task.count({
      where: { ...taskWhere, dueDate: { lt: now }, NOT: { status: "COMPLETED" } },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: taskWhere,
      _count: { priority: true },
    }),
    prisma.task.groupBy({
      by: ["assignedTo"],
      where: { ...taskWhere, assignedTo: { not: null } },
      _count: { assignedTo: true },
    }),
    prisma.project.findMany({
      where: projectWhere,
      include: { tasks: { select: { status: true } } },
    }),
    prisma.task.findMany({
      where: {
        ...taskWhere,
        status: "COMPLETED",
        updatedAt: { gte: weekAgo },
      },
      select: { updatedAt: true },
    }),
  ]);

  const assigneeIds = tasksByAssignee.map((g) => g.assignedTo).filter(Boolean);
  const assignees = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true },
  });
  const assigneeMap = Object.fromEntries(assignees.map((u) => [u.id, u.name]));

  const teamProductivity = tasksByAssignee
    .map((g) => ({
      name: assigneeMap[g.assignedTo] || "Unknown",
      tasks: g._count.assignedTo,
    }))
    .sort((a, b) => b.tasks - a.tasks);

  const mostActiveMember = teamProductivity[0] || null;

  const projectProgress = projects.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === "COMPLETED").length;
    return {
      id: p.id,
      title: p.title,
      total,
      completed: done,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  });

  const priorityDistribution = ["LOW", "MEDIUM", "HIGH"].map((priority) => ({
    priority,
    count: priorityGroups.find((g) => g.priority === priority)?._count.priority || 0,
  }));

  const weeklyMap = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo);
    d.setDate(weekAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    weeklyMap[key] = 0;
  }
  weeklyCompleted.forEach((t) => {
    const key = new Date(t.updatedAt).toISOString().slice(0, 10);
    if (weeklyMap[key] !== undefined) weeklyMap[key]++;
  });
  const weeklyCompletion = Object.entries(weeklyMap).map(([date, completed]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
    completed,
  }));

  res.json({
    summary: {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    teamProductivity,
    mostActiveMember,
    projectProgress,
    priorityDistribution,
    weeklyCompletion,
    statusBreakdown: [
      { name: "Completed", value: completedTasks },
      { name: "Pending", value: pendingTasks },
      { name: "Overdue", value: overdueTasks },
    ],
  });
};

module.exports = { getAdvancedAnalytics };
