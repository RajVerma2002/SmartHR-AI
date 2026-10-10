import asyncHandler from "express-async-handler";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Payroll from "../models/Payroll.js";
import Applicant from "../models/Applicant.js";

// @desc   Dashboard stats + chart data
// @route  GET /api/dashboard/stats
// @access Private
export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  const [
    totalEmployees,
    presentToday,
    pendingLeaves,
    newApplicants,
    payrollAgg,
    deptAgg,
    statusAgg,
  ] = await Promise.all([
    Employee.countDocuments({ status: "Active" }),
    Attendance.countDocuments({ date: today, status: { $in: ["Present", "Late"] } }),
    Leave.countDocuments({ status: "Pending" }),
    Applicant.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
    Payroll.aggregate([
      { $match: { month } },
      { $group: { _id: null, total: { $sum: "$netSalary" } } },
    ]),
    Employee.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]),
    Applicant.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const absentToday = Math.max(0, totalEmployees - presentToday);
  const payrollSummary = payrollAgg[0]?.total || 0;

  // Last 6 months attendance trend (present counts)
  const attendanceTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.toISOString().slice(0, 7);
    const count = await Attendance.countDocuments({
      date: { $regex: `^${m}` },
      status: { $in: ["Present", "Late"] },
    });
    attendanceTrend.push({ month: m, present: count });
  }

  res.json({
    success: true,
    stats: {
      totalEmployees,
      presentToday,
      absentToday,
      pendingLeaves,
      newApplicants,
      payrollSummary,
    },
    charts: {
      departmentDistribution: deptAgg.map((d) => ({ name: d._id, value: d.count })),
      applicantStatus: statusAgg.map((s) => ({ name: s._id, value: s.count })),
      attendanceTrend,
    },
  });
});
