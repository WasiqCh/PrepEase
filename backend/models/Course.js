import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    programSemester: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    credits: {
      type: Number,
      default: 3,
    },
    semester: {
      type: String,
      enum: ["Fall", "Spring", "Summer"],
      default: "Fall",
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

courseSchema.index({ department: 1, programSemester: 1, courseCode: 1 }, { unique: true });

const Course = mongoose.model("Course", courseSchema);

export default Course;
