import express from "express";
import {
  getAiStatus,
  screenResume,
  screenResumeText,
  interviewQuestions,
  hrChat,
  getChatHistory,
} from "../controllers/aiController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const manager = authorize("Super Admin", "HR Manager");

router.get("/status", protect, getAiStatus);
router.post("/screen/:applicantId", protect, manager, screenResume);
router.post("/screen-text", protect, manager, screenResumeText);
router.post("/interview-questions", protect, manager, interviewQuestions);
router.post("/chat", protect, hrChat);
router.get("/chat/history", protect, getChatHistory);

export default router;
