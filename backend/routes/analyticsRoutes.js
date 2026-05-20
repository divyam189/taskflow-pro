const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getAdvancedAnalytics } = require("../controllers/analyticsController");

const router = express.Router();

router.use(protect);
router.get("/advanced", getAdvancedAnalytics);

module.exports = router;
