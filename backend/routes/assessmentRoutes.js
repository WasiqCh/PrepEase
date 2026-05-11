import express from "express";
import {
  submitAssessment,
  createAssignment,
  getCourseAssignments,
  getEnrolledCourseAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  getSubmission,
  gradeSubmission,
  getCourseSubmissions,
} from "../controllers/assessmentController.js";
import { protect, isTeacher } from "../middleware/authMiddleware.js";
import { validateGeminiApiKey } from "../middleware/geminiValidator.js";

const router = express.Router();

// Assessment submission
router.post("/submit", protect, submitAssessment);

// Student-specific routes (must come before generic :assignmentId routes)
router.get("/student/course/:courseId", protect, getEnrolledCourseAssignments);

// Teacher submission viewing and grading routes
router.get("/submissions/assignment/:assignmentId", protect, isTeacher, getAssignmentSubmissions);
router.get("/submissions/course/:courseId", protect, isTeacher, getCourseSubmissions);
router.get("/submission/:submissionId", protect, getSubmission);
router.put("/submission/:submissionId/grade", protect, isTeacher, gradeSubmission);

// Assignment CRUD endpoints (teacher only) - with API key validation for AI generation
router.post("/", protect, isTeacher, validateGeminiApiKey, createAssignment);
router.get("/course/:courseId", protect, isTeacher, getCourseAssignments);

// Single assignment endpoints
router.get("/:assignmentId", protect, getAssignment);
router.put("/:assignmentId", protect, isTeacher, updateAssignment);
router.delete("/:assignmentId", protect, isTeacher, deleteAssignment);

export default router;
