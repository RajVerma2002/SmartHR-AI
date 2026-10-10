import asyncHandler from "express-async-handler";
import Applicant from "../models/Applicant.js";
import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";
import Payroll from "../models/Payroll.js";
import Attendance from "../models/Attendance.js";
import ChatHistory from "../models/ChatHistory.js";
import {
  analyzeResume,
  generateInterviewQuestions,
  chatWithHR,
  aiStatus,
} from "../utils/geminiService.js";

// @desc   AI status (is Gemini configured?)
// @route  GET /api/ai/status
// @access Private
export const getAiStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, ...aiStatus() });
});

// @desc   Screen an applicant's CV with AI
// @route  POST /api/ai/screen/:applicantId
// @access Private (Super Admin, HR Manager)
export const screenResume = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findById(req.params.applicantId);
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }
  if (!applicant.cvText) {
    res.status(400);
    throw new Error("No CV text found. Upload a PDF CV for this applicant first.");
  }

  const result = await analyzeResume(applicant.cvText, applicant.position);

  applicant.aiScore = result.score;
  applicant.aiRecommendation = result.recommendation;
  applicant.aiSummary = result.summary;
  applicant.aiSkills = result.skills || [];
  applicant.aiScreenedAt = new Date();
  if (applicant.status === "Applied" || applicant.status === "Screening") {
    applicant.status = result.score >= 75 ? "Shortlisted" : "Screening";
  }
  await applicant.save();

  res.json({ success: true, applicant, configured: result.configured });
});

// @desc   Screen raw CV text (without saving an applicant)
// @route  POST /api/ai/screen-text
// @access Private (Super Admin, HR Manager)
export const screenResumeText = asyncHandler(async (req, res) => {
  const { cvText, position } = req.body;
  if (!cvText || !position) {
    res.status(400);
    throw new Error("cvText and position are required");
  }
  const result = await analyzeResume(cvText, position);
  res.json({ success: true, result });
});

// @desc   Generate interview questions
// @route  POST /api/ai/interview-questions
// @access Private (Super Admin, HR Manager)
export const interviewQuestions = asyncHandler(async (req, res) => {
  const { position, experience } = req.body;
  if (!position) {
    res.status(400);
    throw new Error("position is required");
  }
  const questions = await generateInterviewQuestions(position, experience);
  res.json({ success: true, questions });
});

// Build a compact snapshot of live HR data for the chatbot.
const buildHRContext = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  const [totalEmployees, presentToday, pendingLeaves, applicants, payrollAgg] =
    await Promise.all([
      Employee.countDocuments({ status: "Active" }),
      Attendance.countDocuments({ date: today, status: { $in: ["Present", "Late"] } }),
      Leave.countDocuments({ status: "Pending" }),
      Applicant.countDocuments(),
      Payroll.aggregate([
        { $match: { month } },
        { $group: { _id: null, total: { $sum: "$netSalary" }, count: { $sum: 1 } } },
      ]),
    ]);

  const onLeave = await Leave.find({ status: "Approved" })
    .populate("employee", "name")
    .limit(10);
  const onLeaveNames = onLeave.map((l) => l.employee?.name).filter(Boolean);

  const payrollTotal = payrollAgg[0]?.total || 0;

  return `Date: ${today}
Total active employees: ${totalEmployees}
Present today (incl. late): ${presentToday}
Absent today (approx): ${Math.max(0, totalEmployees - presentToday)}
Pending leave requests: ${pendingLeaves}
Employees currently with approved leave: ${onLeaveNames.join(", ") || "none"}
Total applicants: ${applicants}
Payroll total for ${month}: PKR ${payrollTotal.toLocaleString()}`;
};

// @desc   Chat with the AI HR assistant
// @route  POST /api/ai/chat
// @access Private
export const hrChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400);
    throw new Error("message is required");
  }

  const context = await buildHRContext();
  const response = await chatWithHR(message, context);

  await ChatHistory.create({ user: req.user._id, message, response });

  res.json({ success: true, response });
});

// @desc   Get chat history for current user
// @route  GET /api/ai/chat/history
// @access Private
export const getChatHistory = asyncHandler(async (req, res) => {
  const history = await ChatHistory.find({ user: req.user._id })
    .sort({ createdAt: 1 })
    .limit(100);
  res.json({ success: true, history });
});
