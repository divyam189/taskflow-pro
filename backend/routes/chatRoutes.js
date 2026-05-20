const express = require("express");
const { param } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/errorMiddleware");
const { getChatRooms, getMessages, markChatRead } = require("../controllers/chatController");

const router = express.Router();

router.use(protect);
router.get("/rooms", getChatRooms);
router.get("/:projectId/messages", [param("projectId").notEmpty()], validate, getMessages);
router.put("/:projectId/read", [param("projectId").notEmpty()], validate, markChatRead);

module.exports = router;
