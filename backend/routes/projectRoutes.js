const express = require("express");
const { body, param } = require("express-validator");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/errorMiddleware");
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getAnalytics,
} = require("../controllers/projectController");

const router = express.Router();

router.use(protect);
router.get("/analytics/overview", getAnalytics);
router.get("/", getProjects);
router.get("/:id", [param("id").notEmpty()], validate, getProjectById);
router.post(
  "/",
  [allowRoles("ADMIN"), body("title").trim().notEmpty(), body("description").trim().notEmpty()],
  validate,
  createProject
);
router.put("/:id", [allowRoles("ADMIN"), param("id").notEmpty()], validate, updateProject);
router.delete("/:id", [allowRoles("ADMIN"), param("id").notEmpty()], validate, deleteProject);

module.exports = router;
