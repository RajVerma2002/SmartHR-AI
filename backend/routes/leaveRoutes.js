import express from "express";
import {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  getLeaveBalance,
} from "../controllers/leaveController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const manager = authorize("Super Admin", "HR Manager");

router.route("/").get(protect, getLeaves).post(protect, applyLeave);
router.put("/:id/status", protect, manager, updateLeaveStatus);
router.get("/balance/:employeeId", protect, getLeaveBalance);

export default router;
