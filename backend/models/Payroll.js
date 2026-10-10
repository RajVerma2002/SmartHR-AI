import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    month: { type: String, required: true }, // e.g. "2025-01"
    basicSalary: { type: Number, required: true, default: 0 },
    bonus: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    paidOn: { type: Date },
  },
  { timestamps: true }
);

// Auto-calculate net salary before saving
payrollSchema.pre("save", function (next) {
  this.netSalary =
    (this.basicSalary || 0) +
    (this.bonus || 0) +
    (this.allowances || 0) -
    (this.deductions || 0);
  next();
});

payrollSchema.index({ employee: 1, month: 1 }, { unique: true });

const Payroll = mongoose.model("Payroll", payrollSchema);
export default Payroll;
