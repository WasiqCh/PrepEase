import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  assignTeacherToCourse,
  getMyAssignedCourses,
  assignCoursesToStudent,
} from "../controllers/courseController.js";
import { protect, isAdmin, isTeacher } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllCourses);
router.get("/id/:id", protect, getCourseById);

// Admin course creation
router.post("/", protect, isAdmin, createCourse);

// Admin teacher assignment
router.post("/:courseId/assign-teacher", protect, isAdmin, assignTeacherToCourse);

// Admin assign courses to student
router.post("/assign-to-student/:studentId", protect, isAdmin, assignCoursesToStudent);

// Teacher routes
router.get("/teacher/my-courses", protect, isTeacher, getMyAssignedCourses);

export default router;
