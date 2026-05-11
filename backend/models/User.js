import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Student", "Teacher", "Admin"],
      default: "Student",
      immutable: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    semester: {
      type: String,
      trim: true,
      default: "",
    },
    subjects: {
      type: [String],
      default: [],
    },
    assignedDepartments: {
      type: [String],
      default: [],
    },
    assignedSemesters: {
      type: [String],
      default: [],
    },
    assignedSubjects: {
      type: [String],
      default: [],
    },
    availableCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
