import asyncHandler from "express-async-handler";
import Employee from "../models/Employee.js";

// @desc   Get all employees (with search & department filter)
// @route  GET /api/employees?search=&department=
// @access Private (Super Admin, HR Manager)
export const getEmployees = asyncHandler(async (req, res) => {
  const { search, department } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeId: { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
    ];
  }
  if (department && department !== "All") query.department = department;

  const employees = await Employee.find(query).sort({ createdAt: -1 });
  res.json({ success: true, count: employees.length, employees });
});

// @desc   Get single employee
// @route  GET /api/employees/:id
// @access Private
export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }
  res.json({ success: true, employee });
});

// @desc   Create employee
// @route  POST /api/employees
// @access Private (Super Admin, HR Manager)
export const createEmployee = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  // Auto-generate employeeId if not supplied
  if (!data.employeeId) {
    const count = await Employee.countDocuments();
    data.employeeId = `EMP${String(count + 1).padStart(4, "0")}`;
  }

  const employee = await Employee.create(data);
  res.status(201).json({ success: true, employee });
});

// @desc   Update employee
// @route  PUT /api/employees/:id
// @access Private (Super Admin, HR Manager)
export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }
  res.json({ success: true, employee });
});

// @desc   Delete employee
// @route  DELETE /api/employees/:id
// @access Private (Super Admin, HR Manager)
export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }
  res.json({ success: true, message: "Employee removed" });
});
