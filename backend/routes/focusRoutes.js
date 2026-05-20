const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createFocusSession, getFocusHistory, getFocusStats } = require("../controllers/focusController");

const router = express.Router();

router.use(protect);
router.get("/stats", getFocusStats);
router.get("/history", getFocusHistory);
router.post("/sessions", createFocusSession);

module.exports = router;
