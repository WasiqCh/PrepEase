import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 2,
        message: "At least 2 options are required.",
      },
    },
    correctAns: {
      type: Number,
      required: true,
    },
    explanation: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    type: {
      type: String,
      enum: ["AI-Generated", "Manual"],
      default: "Manual",
    },
  },
  { timestamps: true }
);

const Assessment = mongoose.model("Assessment", assessmentSchema);

export default Assessment;
