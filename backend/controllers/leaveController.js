import asyncHandler from "express-async-handler";
import Leave from "../models/Leave.js";

const daysBetween = (start, end) => {
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
};

// @desc   Apply for leave
// @route  POST /api/leaves
// @access Private
export const applyLeave = asyncHandler(async (req, res) => {
  const { employee, leaveType, startDate, endDate, reason } = req.body;
  if (!employee || !startDate || !endDate) {
    res.status(400);
    throw new Error("employee, startDate and endDate are required");
  }

  const leave = await Leave.create({
    employee,
    leaveType,
    startDate,
    endDate,
    reason,
    days: daysBetween(startDate, endDate),
  });

  res.status(201).json({ success: true, leave });
});

// @desc   Get all leaves (filter by status / employee)
// @route  GET /api/leaves?status=&employee=
// @access Private
export const getLeaves = asyncHandler(async (req, res) => {
  const { status, employee } = req.query;
  const query = {};
  if (status && status !== "All") query.status = status;
  if (employee) query.employee = employee;

  const leaves = await Leave.find(query)
    .populate("employee", "name employeeId department")
    .populate("reviewedBy", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: leaves.length, leaves });
});

// @desc   Approve or reject a leave
// @route  PUT /api/leaves/:id/status
// @access Private (Super Admin, HR Manager)
export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!["Approved", "Rejected"].includes(status)) {
    res.status(400);
    throw new Error("status must be 'Approved' or 'Rejected'");
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) {
    res.status(404);
    throw new Error("Leave request not found");
  }

  leave.status = status;
  leave.reviewNote = reviewNote || "";
  leave.reviewedBy = req.user._id;
  await leave.save();

  res.json({ success: true, leave });
});

// @desc   Leave balance for an employee (simple yearly allowance model)
// @route  GET /api/leaves/balance/:employeeId
// @access Private
export const getLeaveBalance = asyncHandler(async (req, res) => {
  const ALLOWANCE = { Casual: 10, Sick: 8, Annual: 14, Maternity: 90, Unpaid: 0 };
  const year = new Date().getFullYear();

  const leaves = await Leave.find({
    employee: req.params.employeeId,
    status: "Approved",
    startDate: { $gte: new Date(`${year}-01-01`) },
  });

  const used = {};
  leaves.forEach((l) => {
    used[l.leaveType] = (used[l.leaveType] || 0) + l.days;
  });

  const balance = Object.keys(ALLOWANCE).map((type) => ({
    leaveType: type,
    allowed: ALLOWANCE[type],
    used: used[type] || 0,
    remaining: ALLOWANCE[type] - (used[type] || 0),
  }));

  res.json({ success: true, year, balance });
});
