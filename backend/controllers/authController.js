import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email and password");
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  // Public registration is restricted to Employee / Applicant roles.
  // Admin/HR accounts are created via seed or by a Super Admin.
  const safeRole = ["Employee", "Applicant"].includes(role) ? role : "Employee";

  const user = await User.create({ name, email, password, role: safeRole });

  res.status(201).json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    token: generateToken(user._id),
  });
});

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    token: generateToken(user._id),
  });
});

// @desc   Get current logged-in user
// @route  GET /api/auth/me
// @access Private
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
