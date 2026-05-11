import express from "express";
import {
  createQuiz,
  generateQuiz,
  getQuizzesByMaterial,
  getQuizById,
  deleteQuiz,
  getQuizzesByCourse,
  submitQuizAttempt,
  getQuizAttempts,
  getQuizAttemptSummaryByCourse,
} from "../controllers/quizController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateGeminiApiKey } from "../middleware/geminiValidator.js";

const router = express.Router();

// Create quiz manually (Teacher only)
router.post("/", protect, createQuiz);

// Generate quiz from material (Teacher only) - with API key validation
router.post("/generate", protect, validateGeminiApiKey, generateQuiz);

// Get quizzes for a specific material
router.get("/material/:materialId", protect, getQuizzesByMaterial);

// Get quizzes for a specific course
router.get("/course/:courseId", protect, getQuizzesByCourse);

// Get quiz attempt summary for a course (Teacher only)
router.get("/course/:courseId/attempts-summary", protect, getQuizAttemptSummaryByCourse);

// Get a single quiz by ID
router.get("/:quizId", protect, getQuizById);

// Submit quiz attempt (Student only)
router.post("/:quizId/submit", protect, submitQuizAttempt);

// Get quiz attempts for student
router.get("/:quizId/attempts", protect, getQuizAttempts);

// Delete a quiz (Teacher only)
router.delete("/:quizId", protect, deleteQuiz);

export default router;
