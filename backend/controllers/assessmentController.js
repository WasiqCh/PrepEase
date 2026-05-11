import Assessment from "../models/Assessment.js";
import Submission from "../models/Submission.js";
import Course from "../models/Course.js";
import StudentEnrollment from "../models/StudentEnrollment.js";

// Create an assignment
export const createAssignment = async (req, res) => {
  try {
    const { title, description, courseId, dueDate, totalMarks } = req.body;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!title || !courseId) {
      return res.status(400).json({ message: "Title and courseId are required." });
    }

    // Verify teacher is assigned to the course
    const course = await Course.findById(courseId);
    if (!course || !course.teachers.some(t => t.toString() === teacherId.toString())) {
      return res.status(403).json({ message: "You don't have permission to create assignments for this course." });
    }

    const assignment = await Assessment.create({
      title,
      course: courseId,
      description: description || "",
      dueDate: dueDate || null,
      totalMarks: totalMarks || 100,
      type: "Manual",
      questions: [],
    });

    return res.status(201).json({
      message: "Assignment created successfully.",
      assignment,
    });
  } catch (error) {
    console.error("[Assessment] createAssignment error:", error.message || error);
    return res.status(500).json({ message: "Failed to create assignment." });
  }
};

// Get assignments for a course (teacher only)
export const getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Verify teacher is assigned to the course
    const course = await Course.findById(courseId);
    if (!course || !course.teachers.some(t => t.toString() === teacherId.toString())) {
      return res.status(403).json({ message: "You don't have permission to view assignments for this course." });
    }

    const assignments = await Assessment.find({ course: courseId }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Assignments fetched successfully.",
      assignments,
    });
  } catch (error) {
    console.error("[Assessment] getCourseAssignments error:", error.message || error);
    return res.status(500).json({ message: "Failed to fetch assignments." });
  }
};

// Get assignments for enrolled courses (student view)
export const getEnrolledCourseAssignments = async (req, res) => {
  try {
    const studentId = req.user?._id;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const { courseId } = req.params;

    // Verify student is enrolled in the course
    const enrollment = await StudentEnrollment.findOne({ student: studentId, course: courseId });
    
    if (!enrollment) {
      return res.status(403).json({ message: "You are not enrolled in this course." });
    }

    const assignments = await Assessment.find({ course: courseId }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Assignments fetched successfully.",
      assignments,
    });
  } catch (error) {
    console.error("[Assessment] getEnrolledCourseAssignments error:", error.message || error);
    return res.status(500).json({ message: "Failed to fetch assignments." });
  }
};

// Get single assignment
export const getAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assessment.findById(assignmentId).populate("course");
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    return res.status(200).json({
      message: "Assignment fetched successfully.",
      assignment,
    });
  } catch (error) {
    console.error("[Assessment] getAssignment error:", error.message || error);
    return res.status(500).json({ message: "Failed to fetch assignment." });
  }
};

// Update assignment
export const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueDate, totalMarks } = req.body;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const assignment = await Assessment.findById(assignmentId).populate("course");
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    // Verify teacher is assigned to the course
    if (!assignment.course.teachers.some(t => t.toString() === teacherId.toString())) {
      return res.status(403).json({ message: "You don't have permission to update this assignment." });
    }

    if (title) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (totalMarks !== undefined) assignment.totalMarks = totalMarks;

    await assignment.save();

    return res.status(200).json({
      message: "Assignment updated successfully.",
      assignment,
    });
  } catch (error) {
    console.error("[Assessment] updateAssignment error:", error.message || error);
    return res.status(500).json({ message: "Failed to update assignment." });
  }
};

// Delete assignment
export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const assignment = await Assessment.findById(assignmentId).populate("course");
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    // Verify teacher is assigned to the course
    if (!assignment.course.teachers.some(t => t.toString() === teacherId.toString())) {
      return res.status(403).json({ message: "You don't have permission to delete this assignment." });
    }

    await Assessment.deleteOne({ _id: assignmentId });

    return res.status(200).json({
      message: "Assignment deleted successfully.",
    });
  } catch (error) {
    console.error("[Assessment] deleteAssignment error:", error.message || error);
    return res.status(500).json({ message: "Failed to delete assignment." });
  }
};

export const submitAssessment = async (req, res) => {
  try {
    const { assessmentId, submission, answers } = req.body;
    const studentId = req.user?._id;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!assessmentId) {
      return res.status(400).json({ message: "assessmentId is required." });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found." });
    }

    const existingSubmission = await Submission.findOne({
      student: studentId,
      assessment: assessmentId,
    });

    if (existingSubmission) {
      return res.status(400).json({ message: "You have already submitted this assessment." });
    }

    // Check if this is a quiz submission (has answers) or assignment submission (has text)
    if (submission) {
      // Assignment submission - just save the text submission
      const submissionRecord = await Submission.create({
        student: studentId,
        assessment: assessmentId,
        submissionText: submission,
        submittedAt: new Date(),
      });

      return res.status(200).json({
        message: "Assignment submitted successfully.",
        submissionId: submissionRecord._id,
      });
    } else if (answers) {
      // Quiz submission with answer scoring
      let correctCount = 0;
      const totalQuestions = assessment.questions.length;

      assessment.questions.forEach((question, index) => {
        const userAnswer = answers[index];
        if (userAnswer !== undefined && userAnswer === question.correctAns) {
          correctCount++;
        }
      });

      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      const submissionRecord = await Submission.create({
        student: studentId,
        assessment: assessmentId,
        answers,
        score,
        totalQuestions,
        correctAnswers: correctCount,
      });

      return res.status(200).json({
        message: "Assessment submitted successfully.",
        score,
        correctAnswers: correctCount,
        totalQuestions,
        submissionId: submissionRecord._id,
      });
    } else {
      return res.status(400).json({ message: "Either submission text or answers are required." });
    }
  } catch (error) {
    console.error("[Assessment] submitAssessment error:", error.message || error);
    return res.status(500).json({ message: "Failed to submit assessment." });
  }
};
// Get submissions for an assignment (teacher view)
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Get the assignment and verify teacher has access
    const assignment = await Assessment.findById(assignmentId).populate("course");
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    if (!assignment.course.teachers.some(t => t.toString() === teacherId.toString())) {
      return res.status(403).json({ message: "You don't have permission to view submissions for this assignment." });
    }

    // Get all submissions for this assignment with student details
    const submissions = await Submission.find({ assessment: assignmentId })
      .populate("student", "name email")
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      message: "Submissions fetched successfully.",
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        totalMarks: assignment.totalMarks,
        dueDate: assignment.dueDate,
      },
      submissions,
      totalSubmissions: submissions.length,
    });
  } catch (error) {
    console.error("[Assessment] getAssignmentSubmissions error:", error.message || error);
    return res.status(500).json({ message: "Failed to fetch submissions." });
  }
};

// Get a single submission (teacher and student)
export const getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const submission = await Submission.findById(submissionId)
      .populate("student", "name email")
      .populate("assessment");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found." });
    }

    // Verify access - either teacher of the course or the student who submitted
    const isStudent = submission.student._id.toString() === userId.toString();
    if (!isStudent) {
      // Check if user is a teacher of this course
      const assignment = await Assessment.findById(submission.assessment._id).populate("course");
      const isTeacher = assignment.course.teachers.some(t => t.toString() === userId.toString());
      if (!isTeacher) {
        return res.status(403).json({ message: "You don't have permission to view this submission." });
      }
    }

    return res.status(200).json({
      message: "Submission fetched successfully.",
      submission,
    });
  } catch (error) {
    console.error("[Assessment] getSubmission error:", error.message || error);
    return res.status(500).json({ message: "Failed to fetch submission." });
  }
};

// Grade a submission (teacher only)
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (score === undefined || score === null) {
      return res.status(400).json({ message: "Score is required." });
    }

    const submission = await Submission.findById(submissionId).populate("assessment");
    if (!submission) {
      return res.status(404).json({ message: "Submission not found." });
    }

    // Verify teacher has access to this assignment's course
    const assignment = await Assessment.findById(submission.assessment._id).populate("course");
    if (!assignment.course.teachers.some(t => t.toString() === teacherId.toString())) {
      return res.status(403).json({ message: "You don't have permission to grade this submission." });
    }

    // Update submission with grade and feedback
    submission.score = Math.min(Math.max(score, 0), assignment.totalMarks); // Clamp between 0 and totalMarks
    submission.feedback = feedback || "";
    submission.gradedAt = new Date();
    submission.gradedBy = teacherId;

    await submission.save();

    return res.status(200).json({
      message: "Submission graded successfully.",
      submission,
    });
  } catch (error) {
    console.error("[Assessment] gradeSubmission error:", error.message || error);
    return res.status(500).json({ message: "Failed to grade submission." });
  }
};

// Get submissions for a course (all assignments)
export const getCourseSubmissions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user?._id;

    if (!teacherId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Verify teacher has access to this course
    const course = await Course.findById(courseId);
    if (!course || !course.teachers.some(t => t.toString() === teacherId.toString())) {
      return res.status(403).json({ message: "You don't have permission to view submissions for this course." });
    }

    // Get all assignments for the course
    const assignments = await Assessment.find({ course: courseId });
    const assignmentIds = assignments.map(a => a._id);

    // Get all submissions for these assignments with student details
    const submissions = await Submission.find({ assessment: { $in: assignmentIds } })
      .populate("student", "name email _id")
      .populate("assessment", "title totalMarks");

    // Group by assignment
    const submissionsByAssignment = assignments.map(assignment => ({
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        totalMarks: assignment.totalMarks,
        dueDate: assignment.dueDate,
      },
      submissions: submissions.filter(s => s.assessment._id.toString() === assignment._id.toString()),
    }));

    return res.status(200).json({
      message: "Course submissions fetched successfully.",
      course: { _id: course._id, title: course.title },
      submissionsByAssignment,
    });
  } catch (error) {
    console.error("[Assessment] getCourseSubmissions error:", error.message || error);
    return res.status(500).json({ message: "Failed to fetch course submissions." });
  }
};