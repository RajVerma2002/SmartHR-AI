import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Payroll from "../models/Payroll.js";
import Applicant from "../models/Applicant.js";
import ChatHistory from "../models/ChatHistory.js";

dotenv.config();

const todayStr = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => todayStr().slice(0, 7);

const seed = async () => {
  try {
    await connectDB();
    console.log("🌱 Clearing existing data...");
    await Promise.all([
      User.deleteMany(),
      Employee.deleteMany(),
      Attendance.deleteMany(),
      Leave.deleteMany(),
      Payroll.deleteMany(),
      Applicant.deleteMany(),
      ChatHistory.deleteMany(),
    ]);

    // ---------- Employees ----------
    console.log("🌱 Creating employees...");
    const employeesData = [
      { employeeId: "EMP0001", name: "Sara Khan", email: "sara.khan@smarthr.com", department: "Human Resources", designation: "HR Manager", salary: 180000, gender: "Female", phone: "+92 300 1112233" },
      { employeeId: "EMP0002", name: "Ali Raza", email: "ali.raza@smarthr.com", department: "Engineering", designation: "Senior Developer", salary: 220000, gender: "Male", phone: "+92 301 2223344" },
      { employeeId: "EMP0003", name: "Fatima Noor", email: "fatima.noor@smarthr.com", department: "Engineering", designation: "Frontend Developer", salary: 160000, gender: "Female", phone: "+92 302 3334455" },
      { employeeId: "EMP0004", name: "Bilal Ahmed", email: "bilal.ahmed@smarthr.com", department: "Sales", designation: "Sales Executive", salary: 120000, gender: "Male", phone: "+92 303 4445566" },
      { employeeId: "EMP0005", name: "Ayesha Malik", email: "ayesha.malik@smarthr.com", department: "Marketing", designation: "Marketing Lead", salary: 150000, gender: "Female", phone: "+92 304 5556677" },
      { employeeId: "EMP0006", name: "Usman Tariq", email: "usman.tariq@smarthr.com", department: "Finance", designation: "Accountant", salary: 140000, gender: "Male", phone: "+92 305 6667788" },
      { employeeId: "EMP0007", name: "Hina Shah", email: "hina.shah@smarthr.com", department: "Operations", designation: "Operations Manager", salary: 170000, gender: "Female", phone: "+92 306 7778899" },
      { employeeId: "EMP0008", name: "Omar Farooq", email: "omar.farooq@smarthr.com", department: "Support", designation: "Support Engineer", salary: 110000, gender: "Male", phone: "+92 307 8889900" },
    ];
    const employees = await Employee.insertMany(employeesData);

    // ---------- Users (one per role) ----------
    console.log("🌱 Creating users (login accounts)...");
    // NOTE: passwords are hashed by the User model pre-save hook,
    // so we use create() (not insertMany) to trigger hashing.
    await User.create({
      name: "Super Admin",
      email: "admin@smarthr.com",
      password: "admin123",
      role: "Super Admin",
    });
    await User.create({
      name: "Sara Khan",
      email: "hr@smarthr.com",
      password: "hr1234",
      role: "HR Manager",
      employee: employees[0]._id,
    });
    await User.create({
      name: "Ali Raza",
      email: "employee@smarthr.com",
      password: "emp1234",
      role: "Employee",
      employee: employees[1]._id,
    });
    await User.create({
      name: "Junaid Applicant",
      email: "applicant@smarthr.com",
      password: "app1234",
      role: "Applicant",
    });

    // ---------- Attendance (today + a few past days) ----------
    console.log("🌱 Creating attendance...");
    const attendanceDocs = [];
    const today = todayStr();
    employees.slice(0, 6).forEach((emp, i) => {
      const checkIn = new Date();
      checkIn.setHours(i % 2 === 0 ? 9 : 9, i % 2 === 0 ? 5 : 25, 0, 0);
      attendanceDocs.push({
        employee: emp._id,
        date: today,
        checkIn,
        status: i % 2 === 0 ? "Present" : "Late",
        workHours: 0,
      });
    });
    await Attendance.insertMany(attendanceDocs);

    // ---------- Leaves ----------
    console.log("🌱 Creating leave requests...");
    await Leave.insertMany([
      {
        employee: employees[2]._id,
        leaveType: "Casual",
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 86400000),
        days: 2,
        reason: "Family event",
        status: "Pending",
      },
      {
        employee: employees[3]._id,
        leaveType: "Sick",
        startDate: new Date(Date.now() - 3 * 86400000),
        endDate: new Date(Date.now() - 2 * 86400000),
        days: 2,
        reason: "Fever",
        status: "Approved",
      },
      {
        employee: employees[4]._id,
        leaveType: "Annual",
        startDate: new Date(Date.now() + 7 * 86400000),
        endDate: new Date(Date.now() + 10 * 86400000),
        days: 4,
        reason: "Vacation",
        status: "Pending",
      },
    ]);

    // ---------- Payroll (current month) ----------
    console.log("🌱 Creating payroll...");
    const month = currentMonth();
    for (const emp of employees) {
      const p = new Payroll({
        employee: emp._id,
        month,
        basicSalary: emp.salary,
        allowances: Math.round(emp.salary * 0.1),
        bonus: Math.round(emp.salary * 0.05),
        deductions: Math.round(emp.salary * 0.03),
        status: Math.random() > 0.5 ? "Paid" : "Pending",
      });
      await p.save(); // triggers net salary calc
    }

    // ---------- Applicants ----------
    console.log("🌱 Creating applicants...");
    await Applicant.insertMany([
      {
        candidateName: "Zain Abbas",
        email: "zain.abbas@example.com",
        phone: "+92 311 1234567",
        position: "Full Stack Developer",
        status: "Applied",
      },
      {
        candidateName: "Mariam Iqbal",
        email: "mariam.iqbal@example.com",
        phone: "+92 312 2345678",
        position: "UI/UX Designer",
        status: "Shortlisted",
        aiScore: 84,
        aiRecommendation: "Strong Candidate",
        aiSummary: "Strong portfolio with relevant design systems experience.",
        aiSkills: ["Figma", "User Research", "Prototyping", "Design Systems"],
        aiScreenedAt: new Date(),
      },
      {
        candidateName: "Hamza Sheikh",
        email: "hamza.sheikh@example.com",
        phone: "+92 313 3456789",
        position: "Data Analyst",
        status: "Screening",
      },
    ]);

    console.log("\n✅ Seed complete!\n");
    console.log("================ DEMO LOGIN CREDENTIALS ================");
    console.log("Super Admin   ->  admin@smarthr.com     / admin123");
    console.log("HR Manager    ->  hr@smarthr.com        / hr1234");
    console.log("Employee      ->  employee@smarthr.com  / emp1234");
    console.log("Applicant     ->  applicant@smarthr.com / app1234");
    console.log("=======================================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
};

seed();
