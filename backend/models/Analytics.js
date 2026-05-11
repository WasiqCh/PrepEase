import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
    },
    topic: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;
