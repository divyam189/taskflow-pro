const prisma = require("../config/db");
const { getIO } = require("../config/socket");

const listTaskComments = async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { taskId: req.params.taskId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json({ comments });
};

const addComment = async (req, res) => {
  const { content } = req.body;
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: { project: true },
  });
  if (!task) return res.status(404).json({ message: "Task not found" });

  const comment = await prisma.comment.create({
    data: { content, taskId: task.id, userId: req.user.id },
    include: { user: { select: { id: true, name: true } } },
  });

  await prisma.activityLog.create({
    data: { action: "COMMENT_ADDED", metadata: task.id, userId: req.user.id },
  });

  if (task.assignedTo && task.assignedTo !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: task.assignedTo,
        title: "New Comment",
        message: `${req.user.name} commented on task "${task.title}"`,
      },
    });
  }

  const io = getIO();
  if (io) {
    io.to(`task:${task.id}`).emit("comment:created", comment);
    io.to(`user:${task.assignedTo}`).emit("notification:new", {
      title: "New Comment",
      message: `${req.user.name} commented on task "${task.title}"`,
    });
  }

  res.status(201).json({ message: "Comment added", comment });
};

module.exports = { listTaskComments, addComment };
