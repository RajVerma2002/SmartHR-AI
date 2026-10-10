import express from "express";
import {
  getPayrolls,
  createPayroll,
  updatePayroll,
  markPaid,
  deletePayroll,
  downloadPayslip,
} from "../controllers/payrollController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const manager = authorize("Super Admin", "HR Manager");

router.route("/").get(protect, manager, getPayrolls).post(protect, manager, createPayroll);
router.get("/:id/payslip", protect, downloadPayslip);
router.put("/:id/pay", protect, manager, markPaid);
router.route("/:id").put(protect, manager, updatePayroll).delete(protect, manager, deletePayroll);

export default router;
