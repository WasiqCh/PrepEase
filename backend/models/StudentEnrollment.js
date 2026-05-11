import mongoose from "mongoose";

const studentEnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate enrollments
studentEnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const StudentEnrollment = mongoose.model("StudentEnrollment", studentEnrollmentSchema);

export default StudentEnrollment;
