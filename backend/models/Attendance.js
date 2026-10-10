import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: String, required: true }, // stored as YYYY-MM-DD for easy daily lookup
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "On Leave", "Half Day"],
      default: "Present",
    },
    workHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
