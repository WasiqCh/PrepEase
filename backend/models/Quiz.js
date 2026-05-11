import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema(
  {
    question: {
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
    correctAnswer: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
        topic: {
          type: String,
          default: "General",
        },
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseMaterial",
      required: false, // Optional for manually created quizzes
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    timeLimit: {
      type: Number,
      default: 30, // in minutes
    },
    passingScore: {
      type: Number,
      default: 70,
    },
    showAnswers: {
      type: Boolean,
      default: true,
    },
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    questions: {
      type: [quizQuestionSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one question is required.",
      },
    },
    questionCount: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    generatedBy: {
      type: String,
      enum: ["AI", "Manual"],
      default: "Manual",
    },
  },
  { timestamps: true }
);

// Index for faster queries
quizSchema.index({ materialId: 1, isActive: 1 });
quizSchema.index({ courseId: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
