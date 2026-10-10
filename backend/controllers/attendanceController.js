import asyncHandler from "express-async-handler";
import Attendance from "../models/Attendance.js";

const todayStr = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// @desc   Check in an employee
// @route  POST /api/attendance/checkin
// @access Private
export const checkIn = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    res.status(400);
    throw new Error("employeeId is required");
  }

  const date = todayStr();
  let record = await Attendance.findOne({ employee: employeeId, date });
  if (record && record.checkIn) {
    res.status(400);
    throw new Error("Already checked in today");
  }

  const now = new Date();
  // Late if check-in after 09:15 local time
  const lateThreshold = new Date(now);
  lateThreshold.setHours(9, 15, 0, 0);
  const status = now > lateThreshold ? "Late" : "Present";

  if (!record) {
    record = await Attendance.create({ employee: employeeId, date, checkIn: now, status });
  } else {
    record.checkIn = now;
    record.status = status;
    await record.save();
  }

  res.status(201).json({ success: true, attendance: record });
});

// @desc   Check out an employee
// @route  POST /api/attendance/checkout
// @access Private
export const checkOut = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;
  const date = todayStr();
  const record = await Attendance.findOne({ employee: employeeId, date });

  if (!record || !record.checkIn) {
    res.status(400);
    throw new Error("Must check in before checking out");
  }
  if (record.checkOut) {
    res.status(400);
    throw new Error("Already checked out today");
  }

  record.checkOut = new Date();
  record.workHours = Number(
    ((record.checkOut - record.checkIn) / (1000 * 60 * 60)).toFixed(2)
  );
  await record.save();

  res.json({ success: true, attendance: record });
});

// @desc   Get attendance records (optional date / employee filter)
// @route  GET /api/attendance?date=&employee=&month=
// @access Private
export const getAttendance = asyncHandler(async (req, res) => {
  const { date, employee, month } = req.query;
  const query = {};
  if (date) query.date = date;
  if (employee) query.employee = employee;
  if (month) query.date = { $regex: `^${month}` }; // month = YYYY-MM

  const records = await Attendance.find(query)
    .populate("employee", "name employeeId department")
    .sort({ date: -1, createdAt: -1 });

  res.json({ success: true, count: records.length, records });
});

// @desc   Monthly summary for one employee
// @route  GET /api/attendance/summary/:employeeId?month=YYYY-MM
// @access Private
export const getMonthlySummary = asyncHandler(async (req, res) => {
  const month = req.query.month || todayStr().slice(0, 7);
  const records = await Attendance.find({
    employee: req.params.employeeId,
    date: { $regex: `^${month}` },
  });

  const summary = {
    month,
    totalDays: records.length,
    present: records.filter((r) => r.status === "Present").length,
    late: records.filter((r) => r.status === "Late").length,
    absent: records.filter((r) => r.status === "Absent").length,
    onLeave: records.filter((r) => r.status === "On Leave").length,
    totalHours: records.reduce((s, r) => s + (r.workHours || 0), 0),
  };

  res.json({ success: true, summary, records });
});
