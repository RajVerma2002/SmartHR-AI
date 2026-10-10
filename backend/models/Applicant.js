import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema(
  {
    candidateName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    position: { type: String, required: true },
    cvPath: { type: String, default: "" }, // relative path to uploaded CV
    cvText: { type: String, default: "" }, // extracted text from CV
    status: {
      type: String,
      enum: ["Applied", "Screening", "Shortlisted", "Interviewed", "Hired", "Rejected"],
      default: "Applied",
    },
    // AI screening results
    aiScore: { type: Number, default: null },
    aiRecommendation: {
      type: String,
      enum: ["Strong Candidate", "Average Candidate", "Not Recommended", null],
      default: null,
    },
    aiSummary: { type: String, default: "" },
    aiSkills: [{ type: String }],
    aiScreenedAt: { type: Date },
  },
  { timestamps: true }
);

const Applicant = mongoose.model("Applicant", applicantSchema);
export default Applicant;
