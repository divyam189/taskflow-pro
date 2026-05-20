const prisma = require("../config/db");

const canViewProject = (project, userId, role) =>
  role === "ADMIN" || project.createdById === userId || project.members.some((m) => m.userId === userId);

const getProjects = async (req, res) => {
  const { search = "", status } = req.query;
  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const projects = await prisma.project.findMany({
    where:
      req.user.role === "ADMIN"
        ? where
        : {
            ...where,
            OR: [
              ...(where.OR || []),
              { createdById: req.user.id },
              { members: { some: { userId: req.user.id } } },
            ],
          },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      tasks: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ projects });
};

const createProject = async (req, res) => {
  const { title, description, status, dueDate, memberIds = [] } = req.body;
  const project = await prisma.project.create({
    data: {
      title,
      description,
      status: status || "PLANNING",
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: req.user.id,
      members: {
        create: memberIds.map((memberId) => ({ userId: memberId })),
      },
    },
    include: { members: true },
  });
  await prisma.activityLog.create({
    data: { action: "PROJECT_CREATED", metadata: project.id, userId: req.user.id },
  });
  res.status(201).json({ message: "Project created", project });
};

const getProjectById = async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      tasks: { include: { assignee: { select: { id: true, name: true, email: true } } } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (!canViewProject(project, req.user.id, req.user.role)) return res.status(403).json({ message: "Forbidden" });
  return res.json({ project });
};

const updateProject = async (req, res) => {
  const { title, description, status, dueDate, memberIds } = req.body;
  const project = await prisma.project.findUnique({ where: { id: req.params.id }, include: { members: true } });
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (req.user.role !== "ADMIN" && project.createdById !== req.user.id) return res.status(403).json({ message: "Forbidden" });

  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(status ? { status } : {}),
      ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      ...(Array.isArray(memberIds)
        ? {
            members: {
              deleteMany: {},
              create: memberIds.map((memberId) => ({ userId: memberId })),
            },
          }
        : {}),
    },
  });
  res.json({ message: "Project updated", project: updated });
};

const deleteProject = async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (req.user.role !== "ADMIN" && project.createdById !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: "Project deleted" });
};

const getAnalytics = async (req, res) => {
  const whereTask =
    req.user.role === "ADMIN" ? {} : { OR: [{ assignedTo: req.user.id }, { project: { createdById: req.user.id } }] };
  const [totalProjects, totalTasks, completedTasks, pendingTasks, overdueTasks, recentActivity] = await Promise.all([
    prisma.project.count(req.user.role === "ADMIN" ? {} : { where: { OR: [{ createdById: req.user.id }, { members: { some: { userId: req.user.id } } }] } }),
    prisma.task.count({ where: whereTask }),
    prisma.task.count({ where: { ...whereTask, status: "COMPLETED" } }),
    prisma.task.count({ where: { ...whereTask, NOT: { status: "COMPLETED" } } }),
    prisma.task.count({ where: { ...whereTask, dueDate: { lt: new Date() }, NOT: { status: "COMPLETED" } } }),
    prisma.activityLog.findMany({
      where: req.user.role === "ADMIN" ? {} : { userId: req.user.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  res.json({
    metrics: { totalProjects, totalTasks, completedTasks, pendingTasks, overdueTasks },
    recentActivity,
  });
};

module.exports = { getProjects, createProject, getProjectById, updateProject, deleteProject, getAnalytics };
