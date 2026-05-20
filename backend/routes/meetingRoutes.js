const express = require("express");
const { body, param } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/errorMiddleware");
const { getMeetingsByProject, createMeeting, endMeeting } = require("../controllers/meetingController");

const router = express.Router();

router.use(protect);
router.get("/project/:projectId", [param("projectId").notEmpty()], validate, getMeetingsByProject);
router.post("/", [body("projectId").notEmpty()], validate, createMeeting);
router.put("/:id/end", [param("id").notEmpty()], validate, endMeeting);

module.exports = router;
