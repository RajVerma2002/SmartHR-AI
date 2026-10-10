import express from "express";
import {
  getApplicants,
  getApplicant,
  createApplicant,
  uploadCV,
  updateApplicant,
  deleteApplicant,
} from "../controllers/applicantController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();
const manager = authorize("Super Admin", "HR Manager");

router
  .route("/")
  .get(protect, manager, getApplicants)
  .post(protect, upload.single("cv"), createApplicant);

router.post("/:id/cv", protect, upload.single("cv"), uploadCV);

router
  .route("/:id")
  .get(protect, getApplicant)
  .put(protect, manager, updateApplicant)
  .delete(protect, manager, deleteApplicant);

export default router;
