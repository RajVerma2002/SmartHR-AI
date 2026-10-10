import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Applicant from "../models/Applicant.js";
import { extractPdfText } from "../utils/cvText.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc   Get all applicants (filter by status / position / search)
// @route  GET /api/applicants
// @access Private (Super Admin, HR Manager)
export const getApplicants = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const query = {};
  if (status && status !== "All") query.status = status;
  if (search) {
    query.$or = [
      { candidateName: { $regex: search, $options: "i" } },
      { position: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  const applicants = await Applicant.find(query).sort({ createdAt: -1 });
  res.json({ success: true, count: applicants.length, applicants });
});

// @desc   Get single applicant
// @route  GET /api/applicants/:id
// @access Private
export const getApplicant = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findById(req.params.id);
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }
  res.json({ success: true, applicant });
});

// @desc   Create applicant (optionally with CV upload)
// @route  POST /api/applicants
// @access Public (applicants apply) / Private
export const createApplicant = asyncHandler(async (req, res) => {
  const { candidateName, email, phone, position } = req.body;
  if (!candidateName || !email || !position) {
    res.status(400);
    throw new Error("candidateName, email and position are required");
  }

  const data = { candidateName, email, phone, position };

  if (req.file) {
    data.cvPath = `/uploads/${req.file.filename}`;
    data.cvText = await extractPdfText(req.file.path);
  }

  const applicant = await Applicant.create(data);
  res.status(201).json({ success: true, applicant });
});

// @desc   Upload / replace CV for an existing applicant
// @route  POST /api/applicants/:id/cv
// @access Private
export const uploadCV = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findById(req.params.id);
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("No CV file uploaded");
  }

  applicant.cvPath = `/uploads/${req.file.filename}`;
  applicant.cvText = await extractPdfText(req.file.path);
  applicant.status = "Screening";
  await applicant.save();

  res.json({ success: true, applicant });
});

// @desc   Update applicant (status, details)
// @route  PUT /api/applicants/:id
// @access Private (Super Admin, HR Manager)
export const updateApplicant = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }
  res.json({ success: true, applicant });
});

// @desc   Delete applicant
// @route  DELETE /api/applicants/:id
// @access Private (Super Admin, HR Manager)
export const deleteApplicant = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findById(req.params.id);
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }
  // best-effort cleanup of CV file
  if (applicant.cvPath) {
    const filePath = path.join(__dirname, "..", applicant.cvPath);
    fs.existsSync(filePath) && fs.unlink(filePath, () => {});
  }
  await applicant.deleteOne();
  res.json({ success: true, message: "Applicant removed" });
});
