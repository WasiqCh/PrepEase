import express from "express";
import {
  enrollCourse,
  unenrollCourse,
  getMyEnrollments,
  getCourseEnrollments,
  getStudentCourseDetails,
  getMyCourseDetails,
} from "../controllers/enrollmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student enrollments
router.post("/enroll", protect, enrollCourse);
router.delete("/:courseId", protect, unenrollCourse);
router.get("/my-courses", protect, getMyEnrollments);
router.get("/my-course/:courseId/details", protect, getMyCourseDetails);

// Teacher view enrollments
router.get("/course/:courseId", protect, getCourseEnrollments);
router.get("/course/:courseId/student/:studentId/details", protect, getStudentCourseDetails);

export default router;
