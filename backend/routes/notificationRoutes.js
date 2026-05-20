const express = require("express");
const { param } = require("express-validator");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/errorMiddleware");
const { getNotifications, markNotificationRead } = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.put("/:id/read", [param("id").notEmpty()], validate, markNotificationRead);

module.exports = router;
