const express = require("express");
const { body, param } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/errorMiddleware");
const { listTaskComments, addComment } = require("../controllers/commentController");

const router = express.Router();

router.use(protect);
router.get("/:taskId", [param("taskId").notEmpty()], validate, listTaskComments);
router.post("/:taskId", [param("taskId").notEmpty(), body("content").trim().notEmpty()], validate, addComment);

module.exports = router;
