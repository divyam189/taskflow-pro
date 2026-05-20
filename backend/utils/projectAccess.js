const prisma = require("../config/db");

const canViewProject = (project, userId, role) =>
  role === "ADMIN" ||
  project.createdById === userId ||
  project.members?.some((m) => m.userId === userId);

const getProjectForAccess = async (projectId) =>
  prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

const assertProjectAccess = async (projectId, user) => {
  const project = await getProjectForAccess(projectId);
  if (!project) return { error: { status: 404, message: "Project not found" } };
  if (!canViewProject(project, user.id, user.role)) {
    return { error: { status: 403, message: "Forbidden" } };
  }
  return { project };
};

module.exports = { canViewProject, getProjectForAccess, assertProjectAccess };
