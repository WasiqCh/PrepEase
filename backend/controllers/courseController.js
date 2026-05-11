import Course from "../models/Course.js";
import User from "../models/User.js";

// ADMIN: Create Course
export const createCourse = async (req, res) => {
  try {
    const { courseCode, title, department, programSemester, description, credits, semester, year } = req.body;

    if (!courseCode || !title || !department || !programSemester) {
      return res.status(400).json({
        message: "courseCode, title, department, and programSemester are required.",
      });
    }

    const existingCourse = await Course.findOne({
      department,
      programSemester,
      courseCode,
    });

    if (existingCourse) {
      return res.status(400).json({
        message: "This course already exists in the selected department and semester.",
      });
    }

    const course = await Course.create({
      courseCode,
      title,
      department,
      programSemester,
      description: description || "",
      credits: credits || 3,
      semester: semester || "Spring",
      year: year || 2026,
      teachers: [],
      isActive: true,
    });

    return res.status(201).json({
      message: "Course created successfully.",
      course,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to create course." });
  }
};

// ADMIN: Get All Courses (filtered by student if applicable)
export const getAllCourses = async (req, res) => {
  try {
    let courses;

    if (req.user.role === "Student") {
      // Students see only courses assigned to them by admin
      const student = await User.findById(req.user._id);
      if (!student || !student.availableCourses) {
        return res.status(200).json({ courses: [] });
      }
      
      courses = await Course.find({ _id: { $in: student.availableCourses } })
        .populate("teachers", "firstName lastName email")
        .sort({ department: 1, programSemester: 1, courseCode: 1 })
        .lean();
    } else {
      // Admins and teachers see all courses
      courses = await Course.find()
        .populate("teachers", "firstName lastName email")
        .sort({ department: 1, programSemester: 1, courseCode: 1 })
        .lean();
    }

    return res.status(200).json({ courses });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to fetch courses." });
  }
};

// ADMIN: Get Course By ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate("teachers", "firstName lastName email");

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.status(200).json({ course });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to fetch course." });
  }
};

// TEACHER: Get My Assigned Courses
export const getMyAssignedCourses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const courses = await Course.find({ teachers: teacherId, isActive: true })
      .populate("teachers", "firstName lastName email")
      .sort({ courseCode: 1 });

    return res.status(200).json({ courses });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to fetch your courses." });
  }
};

// ADMIN: Assign Teacher to Course
export const assignTeacherToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "Teacher") {
      return res.status(404).json({ message: "Teacher not found." });
    }

    if (course.teachers.some((id) => id.toString() === teacherId.toString())) {
      return res.status(400).json({ message: "Teacher already assigned to this course." });
    }

    course.teachers.push(teacherId);
    await course.save();

    const populatedCourse = await Course.findById(courseId).populate("teachers", "firstName lastName email");

    return res.status(200).json({
      message: "Teacher assigned to course successfully.",
      course: populatedCourse,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to assign teacher." });
  }
};

// ADMIN: Assign Courses to Student
export const assignCoursesToStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseIds } = req.body; // Array of course IDs

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required." });
    }

    if (!Array.isArray(courseIds)) {
      return res.status(400).json({ message: "courseIds must be an array." });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (student.role !== "Student") {
      return res.status(400).json({ message: "User is not a student." });
    }

    // Update student's available courses
    student.availableCourses = courseIds;
    await student.save();

    // Return updated student with populated courses
    const updatedStudent = await User.findById(studentId).populate("availableCourses", "courseCode title department programSemester");

    return res.status(200).json({
      message: "Courses assigned to student successfully.",
      student: updatedStudent,
      availableCoursesCount: courseIds.length,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to assign courses to student." });
  }
};