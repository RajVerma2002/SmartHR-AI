import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    department: {
      type: String,
      enum: ["Engineering", "Human Resources", "Sales", "Marketing", "Finance", "Operations", "Support"],
      default: "Operations",
    },
    designation: { type: String, default: "" },
    salary: { type: Number, default: 0 },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    address: { type: String, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
