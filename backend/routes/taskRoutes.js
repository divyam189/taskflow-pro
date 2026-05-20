const express = require("express");
const { body, param } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/errorMiddleware");
const { getTasks, getTasksByDateRange, createTask, updateTask, deleteTask, getTasksByProject } = require("../controllers/taskController");

const router = express.Router();

router.use(protect);
router.get("/calendar", getTasksByDateRange);
router.get("/", getTasks);
router.get("/project/:projectId", [param("projectId").notEmpty()], validate, getTasksByProject);
router.post("/", [body("title").trim().notEmpty(), body("projectId").notEmpty()], validate, createTask);
router.put("/:id", [param("id").notEmpty()], validate, updateTask);
router.delete("/:id", [param("id").notEmpty()], validate, deleteTask);

module.exports = router;
