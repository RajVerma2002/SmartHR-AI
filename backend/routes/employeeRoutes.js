import express from "express";
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
const manager = authorize("Super Admin", "HR Manager");

router.route("/").get(protect, getEmployees).post(protect, manager, createEmployee);
router
  .route("/:id")
  .get(protect, getEmployee)
  .put(protect, manager, updateEmployee)
  .delete(protect, manager, deleteEmployee);

export default router;
