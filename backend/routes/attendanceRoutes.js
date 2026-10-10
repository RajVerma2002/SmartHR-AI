import express from "express";
import {
  checkIn,
  checkOut,
  getAttendance,
  getMonthlySummary,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAttendance);
router.post("/checkin", protect, checkIn);
router.post("/checkout", protect, checkOut);
router.get("/summary/:employeeId", protect, getMonthlySummary);

export default router;
