const prisma = require("../config/db");
const { assertProjectAccess } = require("../utils/projectAccess");

const ensureChatRoom = async (projectId) => {
  let room = await prisma.chatRoom.findUnique({ where: { projectId } });
  if (!room) {
    room = await prisma.chatRoom.create({ data: { projectId } });
  }
  return room;
};

const getUnreadCount = async (chatRoomId, userId) => {
  const readState = await prisma.chatReadState.findUnique({
    where: { userId_chatRoomId: { userId, chatRoomId } },
  });
  const since = readState?.lastReadAt || new Date(0);
  return prisma.message.count({
    where: {
      chatRoomId,
      userId: { not: userId },
      createdAt: { gt: since },
    },
  });
};

const getChatRooms = async (req, res) => {
  const projectWhere =
    req.user.role === "ADMIN"
      ? {}
      : {
          OR: [{ createdById: req.user.id }, { members: { some: { userId: req.user.id } } }],
        };

  const projects = await prisma.project.findMany({
    where: projectWhere,
    select: { id: true, title: true, status: true },
    orderBy: { updatedAt: "desc" },
  });

  const rooms = await Promise.all(
    projects.map(async (project) => {
      const room = await prisma.chatRoom.findUnique({ where: { projectId: project.id } });
      const unread = room ? await getUnreadCount(room.id, req.user.id) : 0;
      const lastMessage = room
        ? await prisma.message.findFirst({
            where: { chatRoomId: room.id },
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true } } },
          })
        : null;
      return { project, roomId: room?.id || null, unread, lastMessage };
    })
  );

  res.json({ rooms });
};

const getMessages = async (req, res) => {
  const { projectId } = req.params;
  const { error } = await assertProjectAccess(projectId, req.user);
  if (error) return res.status(error.status).json({ message: error.message });

  const room = await ensureChatRoom(projectId);
  const messages = await prisma.message.findMany({
    where: { chatRoomId: room.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  await prisma.chatReadState.upsert({
    where: { userId_chatRoomId: { userId: req.user.id, chatRoomId: room.id } },
    create: { userId: req.user.id, chatRoomId: room.id, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });

  res.json({ messages, roomId: room.id, projectId });
};

const markChatRead = async (req, res) => {
  const { projectId } = req.params;
  const { error } = await assertProjectAccess(projectId, req.user);
  if (error) return res.status(error.status).json({ message: error.message });

  const room = await ensureChatRoom(projectId);
  await prisma.chatReadState.upsert({
    where: { userId_chatRoomId: { userId: req.user.id, chatRoomId: room.id } },
    create: { userId: req.user.id, chatRoomId: room.id, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });
  res.json({ message: "Marked as read" });
};

module.exports = { getChatRooms, getMessages, markChatRead };
