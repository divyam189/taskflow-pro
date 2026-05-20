const jwt = require("jsonwebtoken");
const prisma = require("./db");
const { assertProjectAccess } = require("../utils/projectAccess");

// userId -> Set of socket ids (multi-tab support)
const onlineUsers = new Map();

const addOnline = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

const removeOnline = (userId, socketId) => {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    return false;
  }
  return true;
};

const isUserOnline = (userId) => onlineUsers.has(userId);

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const registerSocketHandlers = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);

    const wasOffline = !isUserOnline(userId);
    addOnline(userId, socket.id);
    if (wasOffline) io.emit("presence:update", { userId, online: true });

    socket.on("join:project", (projectId) => socket.join(`project:${projectId}`));
    socket.on("join:task", (taskId) => socket.join(`task:${taskId}`));

    // Chat room join/leave
    socket.on("chat:join", async (projectId) => {
      const { error } = await assertProjectAccess(projectId, socket.user);
      if (error) return socket.emit("chat:error", error.message);
      socket.join(`chat:${projectId}`);
      socket.emit("presence:list", { onlineUserIds: getOnlineUserIds() });
    });

    socket.on("chat:leave", (projectId) => {
      socket.leave(`chat:${projectId}`);
    });

    socket.on("chat:typing", ({ projectId, isTyping }) => {
      socket.to(`chat:${projectId}`).emit("chat:typing", {
        projectId,
        userId,
        userName: socket.user.name,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on("chat:send", async ({ projectId, content }) => {
      if (!content?.trim()) return;
      const { error, project } = await assertProjectAccess(projectId, socket.user);
      if (error) return socket.emit("chat:error", error.message);

      let room = await prisma.chatRoom.findUnique({ where: { projectId } });
      if (!room) {
        room = await prisma.chatRoom.create({ data: { projectId } });
      }

      const message = await prisma.message.create({
        data: { content: content.trim(), chatRoomId: room.id, userId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      const payload = {
        ...message,
        projectId,
      };

      io.to(`chat:${projectId}`).emit("chat:message", payload);
      io.to(`project:${projectId}`).emit("chat:unread", { projectId });
    });

    socket.on("disconnect", () => {
      const stillOnline = removeOnline(userId, socket.id);
      if (!stillOnline) {
        io.emit("presence:update", { userId, online: false });
      }
    });
  });
};

module.exports = { registerSocketHandlers, isUserOnline, getOnlineUserIds };
