import asyncHandler from "express-async-handler";
import Payroll from "../models/Payroll.js";
import { generatePayslipPDF } from "../utils/pdfService.js";

// @desc   Get all payroll records (filter by month)
// @route  GET /api/payroll?month=YYYY-MM
// @access Private (Super Admin, HR Manager)
export const getPayrolls = asyncHandler(async (req, res) => {
  const { month, employee } = req.query;
  const query = {};
  if (month) query.month = month;
  if (employee) query.employee = employee;

  const payrolls = await Payroll.find(query)
    .populate("employee", "name employeeId department designation")
    .sort({ month: -1 });

  res.json({ success: true, count: payrolls.length, payrolls });
});

// @desc   Create a payroll record
// @route  POST /api/payroll
// @access Private (Super Admin, HR Manager)
export const createPayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.create(req.body);
  res.status(201).json({ success: true, payroll });
});

// @desc   Update a payroll record
// @route  PUT /api/payroll/:id
// @access Private (Super Admin, HR Manager)
export const updatePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) {
    res.status(404);
    throw new Error("Payroll record not found");
  }
  Object.assign(payroll, req.body);
  await payroll.save(); // triggers netSalary recalculation
  res.json({ success: true, payroll });
});

// @desc   Mark payroll as paid
// @route  PUT /api/payroll/:id/pay
// @access Private (Super Admin, HR Manager)
export const markPaid = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) {
    res.status(404);
    throw new Error("Payroll record not found");
  }
  payroll.status = "Paid";
  payroll.paidOn = new Date();
  await payroll.save();
  res.json({ success: true, payroll });
});

// @desc   Delete a payroll record
// @route  DELETE /api/payroll/:id
// @access Private (Super Admin, HR Manager)
export const deletePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByIdAndDelete(req.params.id);
  if (!payroll) {
    res.status(404);
    throw new Error("Payroll record not found");
  }
  res.json({ success: true, message: "Payroll record removed" });
});

// @desc   Download payslip PDF
// @route  GET /api/payroll/:id/payslip
// @access Private
export const downloadPayslip = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id).populate("employee");
  if (!payroll) {
    res.status(404);
    throw new Error("Payroll record not found");
  }
  generatePayslipPDF(payroll, res);
});
