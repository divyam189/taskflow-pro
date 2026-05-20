const crypto = require("crypto");
const prisma = require("../config/db");
const { assertProjectAccess } = require("../utils/projectAccess");

const slugify = (text) =>
  `${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24)}-${crypto.randomBytes(4).toString("hex")}`;

const getMeetingsByProject = async (req, res) => {
  const { projectId } = req.params;
  const { error } = await assertProjectAccess(projectId, req.user);
  if (error) return res.status(error.status).json({ message: error.message });

  const meetings = await prisma.meeting.findMany({
    where: { projectId },
    include: { startedBy: { select: { id: true, name: true } } },
    orderBy: { startedAt: "desc" },
    take: 30,
  });
  res.json({ meetings });
};

const createMeeting = async (req, res) => {
  const { projectId, title } = req.body;
  const { error } = await assertProjectAccess(projectId, req.user);
  if (error) return res.status(error.status).json({ message: error.message });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  const roomSlug = slugify(title || project.title);

  const meeting = await prisma.meeting.create({
    data: {
      title: title || `${project.title} Sync`,
      roomSlug,
      projectId,
      startedById: req.user.id,
    },
    include: { startedBy: { select: { id: true, name: true } } },
  });

  res.status(201).json({
    meeting,
    joinUrl: `${process.env.JITSI_DOMAIN || "https://meet.jit.si"}/${roomSlug}`,
  });
};

const endMeeting = async (req, res) => {
  const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id } });
  if (!meeting) return res.status(404).json({ message: "Meeting not found" });

  const { error } = await assertProjectAccess(meeting.projectId, req.user);
  if (error) return res.status(error.status).json({ message: error.message });

  const updated = await prisma.meeting.update({
    where: { id: meeting.id },
    data: { endedAt: new Date() },
  });
  res.json({ meeting: updated });
};

module.exports = { getMeetingsByProject, createMeeting, endMeeting };
