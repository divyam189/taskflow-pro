const prisma = require("../config/db");
const { getIO } = require("../config/socket");

const getTasks = async (req, res) => {
  const { search = "", status, priority, projectId } = req.query;
  const scopedWhere =
    req.user.role === "ADMIN"
      ? {}
      : {
          OR: [{ assignedTo: req.user.id }, { project: { createdById: req.user.id } }, { project: { members: { some: { userId: req.user.id } } } }],
        };
  const filterWhere = {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(projectId ? { projectId } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const tasks = await prisma.task.findMany({
    where: {
      ...scopedWhere,
      ...filterWhere,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ tasks });
};

const getTasksByDateRange = async (req, res) => {
  const { start, end, projectId, status, assignedTo } = req.query;
  if (!start || !end) {
    return res.status(400).json({ message: "start and end query params required (ISO dates)" });
  }

  const scopedWhere =
    req.user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { assignedTo: req.user.id },
            { project: { createdById: req.user.id } },
            { project: { members: { some: { userId: req.user.id } } } },
          ],
        };

  const tasks = await prisma.task.findMany({
    where: {
      ...scopedWhere,
      dueDate: { gte: new Date(start), lte: new Date(end) },
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(assignedTo ? { assignedTo } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  res.json({ tasks });
};

const getTasksByProject = async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { projectId: req.params.projectId },
    include: { assignee: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ tasks });
};

const createTask = async (req, res) => {
  const { title, description, priority, status, assignedTo, dueDate, projectId } = req.body;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (req.user.role !== "ADMIN" && project.createdById !== req.user.id) return res.status(403).json({ message: "Forbidden" });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || "MEDIUM",
      status: status || "TODO",
      assignedTo: assignedTo || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
    },
  });
  await prisma.activityLog.create({
    data: { action: "TASK_CREATED", metadata: task.id, userId: req.user.id },
  });
  if (assignedTo && assignedTo !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: assignedTo,
        title: "Task Assigned",
        message: `${req.user.name} assigned "${title}" to you`,
      },
    });
  }
  const io = getIO();
  if (io) {
    io.to(`project:${projectId}`).emit("task:created", task);
    if (assignedTo) io.to(`user:${assignedTo}`).emit("notification:new", { title: "Task Assigned", message: `${req.user.name} assigned "${title}" to you` });
  }
  res.status(201).json({ message: "Task created", task });
};

const updateTask = async (req, res) => {
  const { title, description, priority, status, assignedTo, dueDate } = req.body;
  const existing = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { project: true },
  });
  if (!existing) return res.status(404).json({ message: "Task not found" });

  const isAdmin = req.user.role === "ADMIN";
  const isCreator = existing.project.createdById === req.user.id;
  const isAssignee = existing.assignedTo === req.user.id;
  if (!isAdmin && !isCreator && !isAssignee) return res.status(403).json({ message: "Forbidden" });

  const data = { ...(title ? { title } : {}), ...(description ? { description } : {}), ...(priority ? { priority } : {}), ...(status ? { status } : {}), ...(dueDate ? { dueDate: new Date(dueDate) } : {}) };
  if (isAdmin || isCreator) data.assignedTo = assignedTo || null;

  const task = await prisma.task.update({ where: { id: req.params.id }, data });
  await prisma.activityLog.create({
    data: { action: "TASK_UPDATED", metadata: task.id, userId: req.user.id },
  });
  const io = getIO();
  if (io) io.to(`project:${existing.projectId}`).emit("task:updated", task);
  res.json({ message: "Task updated", task });
};

const deleteTask = async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { project: true } });
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (req.user.role !== "ADMIN" && task.project.createdById !== req.user.id) return res.status(403).json({ message: "Forbidden" });
  await prisma.task.delete({ where: { id: req.params.id } });
  const io = getIO();
  if (io) io.to(`project:${task.projectId}`).emit("task:deleted", { id: task.id });
  res.json({ message: "Task deleted" });
};

module.exports = { getTasks, getTasksByDateRange, getTasksByProject, createTask, updateTask, deleteTask };
