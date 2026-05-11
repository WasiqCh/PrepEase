import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    answers: [
      {
        questionIndex: {
          type: Number,
          required: true,
        },
        selectedAnswer: {
          type: Number,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        timeSpent: {
          type: Number, // in seconds
          default: 0,
        },
      },
    ],
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["passed", "failed"],
      required: true,
    },
    timeTaken: {
      type: Number, // in seconds
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for quick lookup
quizAttemptSchema.index({ quizId: 1, studentId: 1 });
quizAttemptSchema.index({ courseId: 1, studentId: 1 });

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;
