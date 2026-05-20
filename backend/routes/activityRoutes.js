const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getActivities } = require("../controllers/activityController");

const router = express.Router();

router.get("/", protect, getActivities);

module.exports = router;
