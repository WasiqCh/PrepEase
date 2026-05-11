import mongoose from "mongoose";
import StudentEnrollment from "../models/StudentEnrollment.js";
import Course from "../models/Course.js";
import Assessment from "../models/Assessment.js";
import Submission from "../models/Submission.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Quiz from "../models/Quiz.js";

/**
 * Enroll a student in a course
 * POST /api/enrollments/enroll
 */
export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user._id;

    // Validation
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required." });
    }

    // Only students can enroll
    if (req.user.role !== "Student") {
      return res.status(403).json({
        message: "Only students can enroll in courses.",
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if already enrolled
    const existingEnrollment = await StudentEnrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        message: "You are already enrolled in this course.",
      });
    }

    // Create enrollment
    const enrollment = await StudentEnrollment.create({
      student: studentId,
      course: courseId,
    });

    await enrollment.populate("course", "courseCode title teachers");

    return res.status(201).json({
      message: "Successfully enrolled in course.",
      enrollment,
    });
  } catch (error) {
    console.error("[Enrollment] enrollCourse error:", error.message);
    return res.status(500).json({
      message: "Failed to enroll in course.",
      error: error.message,
    });
  }
};

/**
 * Unenroll a student from a course
 * DELETE /api/enrollments/:courseId
 */
export const unenrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // Validation
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required." });
    }

    // Only students can unenroll
    if (req.user.role !== "Student") {
      return res.status(403).json({
        message: "Only students can unenroll from courses.",
      });
    }

    // Find enrollment
    const enrollment = await StudentEnrollment.findOneAndDelete({
      student: studentId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({
        message: "You are not enrolled in this course.",
      });
    }

    return res.status(200).json({
      message: "Successfully unenrolled from course.",
    });
  } catch (error) {
    console.error("[Enrollment] unenrollCourse error:", error.message);
    return res.status(500).json({
      message: "Failed to unenroll from course.",
      error: error.message,
    });
  }
};

/**
 * Get all courses a student is enrolled in
 * GET /api/enrollments/my-courses
 */
export const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Only students can view their enrollments
    if (req.user.role !== "Student") {
      return res.status(403).json({
        message: "Only students can view their enrollments.",
      });
    }

    const enrollments = await StudentEnrollment.find({
      student: studentId,
    })
      .populate("course", "courseCode title teachers createdAt")
      .sort({ enrolledAt: -1 })
      .lean();

    return res.status(200).json({
      message: "Enrollments retrieved successfully.",
      enrollments,
      count: enrollments.length,
    });
  } catch (error) {
    console.error("[Enrollment] getMyEnrollments error:", error.message);
    return res.status(500).json({
      message: "Failed to retrieve enrollments.",
      error: error.message,
    });
  }
};

/**
 * Get all students enrolled in a course (Teacher only)
 * GET /api/enrollments/course/:courseId
 */
export const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId).populate("teachers", "email firstName lastName");
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Only a teacher assigned to this course can view enrollments
    if (req.user.role !== "Teacher") {
      return res.status(403).json({
        message: "Only teachers can view course enrollments.",
      });
    }

    // Check if the user is one of the teachers for this course
    const isTeacherOfCourse = course.teachers.some(
      (teacher) => teacher._id.toString() === req.user._id.toString()
    );

    if (!isTeacherOfCourse) {
      return res.status(403).json({
        message: "You are not assigned to this course.",
      });
    }

    const enrollments = await StudentEnrollment.find({
      course: courseId,
    })
      .populate("student", "email firstName lastName")
      .sort({ enrolledAt: -1 })
      .lean();

    let assignmentTotal = 0;
    let assignmentSummary = [];
    
    try {
      const assessments = await Assessment.find({ course: courseId })
        .select("_id")
        .lean();
      assignmentTotal = assessments.length;

      if (assignmentTotal > 0) {
        const assessmentIds = assessments.map((a) => a._id);
        assignmentSummary = await Submission.aggregate([
          { $match: { assessment: { $in: assessmentIds } } },
          {
            $group: {
              _id: "$student",
              submissionCount: { $sum: 1 },
              averageAssignmentScore: { $avg: "$score" },
            },
          },
          {
            $project: {
              _id: 1,
              submissionCount: 1,
              averageAssignmentScore: { $round: ["$averageAssignmentScore", 0] },
            },
          },
        ]);
      }
    } catch (statsErr) {
      console.warn("[Enrollment] Assignment stats fetch failed:", statsErr.message);
    }

    let quizSummary = [];
    try {
      quizSummary = await QuizAttempt.aggregate([
        { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
        {
          $group: {
            _id: "$studentId",
            quizAttempts: { $sum: 1 },
            averageQuizScore: { $avg: "$score" },
          },
        },
        {
          $project: {
            _id: 1,
            quizAttempts: 1,
            averageQuizScore: { $round: ["$averageQuizScore", 0] },
          },
        },
      ]);
    } catch (statsErr) {
      console.warn("[Enrollment] Quiz stats fetch failed:", statsErr.message);
    }

    const assignmentMap = assignmentSummary.reduce((acc, item) => {
      acc[item._id.toString()] = item;
      return acc;
    }, {});

    const quizMap = quizSummary.reduce((acc, item) => {
      acc[item._id.toString()] = item;
      return acc;
    }, {});

    const enrichedEnrollments = enrollments.map((enrollment) => {
      const studentId = enrollment.student?._id?.toString() || "";
      const assignmentStats = assignmentMap[studentId] || {};
      const quizStats = quizMap[studentId] || {};

      const assignmentSubmissions = assignmentStats.submissionCount || 0;
      const averageAssignmentScore = assignmentStats.averageAssignmentScore || 0;
      const quizAttempts = quizStats.quizAttempts || 0;
      const averageQuizScore = quizStats.averageQuizScore || 0;
      const assignmentCompletion = assignmentTotal
        ? Math.round((assignmentSubmissions / assignmentTotal) * 100)
        : 0;

      const performanceScore = assignmentTotal
        ? Math.round((assignmentCompletion + averageQuizScore) / 2)
        : averageQuizScore;

      return {
        ...enrollment,
        assignmentSubmissions,
        assignmentTotal,
        averageAssignmentScore,
        quizAttempts,
        averageQuizScore,
        performanceScore,
      };
    });

    return res.status(200).json({
      message: "Course enrollments retrieved successfully.",
      enrollments: enrichedEnrollments,
      count: enrichedEnrollments.length,
    });
  } catch (error) {
    console.error("[Enrollment] getCourseEnrollments error:", error.message);
    return res.status(500).json({
      message: "Failed to retrieve course enrollments.",
      error: error.message,
    });
  }
};

/**
 * Get detailed performance for a student in a course (Teacher only)
 * GET /api/enrollments/course/:courseId/student/:studentId/details
 */
export const getStudentCourseDetails = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    if (!courseId || !studentId) {
      return res.status(400).json({ message: "courseId and studentId are required." });
    }

    const course = await Course.findById(courseId).populate("teachers", "email firstName lastName");
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (req.user.role !== "Teacher") {
      return res.status(403).json({ message: "Only teachers can view course details." });
    }

    const isTeacherOfCourse = course.teachers.some(
      (teacher) => teacher._id.toString() === req.user._id.toString()
    );

    if (!isTeacherOfCourse) {
      return res.status(403).json({ message: "You are not assigned to this course." });
    }

    const enrollment = await StudentEnrollment.findOne({
      course: courseId,
      student: studentId,
    })
      .populate("student", "email firstName lastName")
      .lean();

    if (!enrollment) {
      return res.status(404).json({ message: "Student is not enrolled in this course." });
    }

    const assessments = await Assessment.find({ course: courseId })
      .select("_id title description dueDate totalMarks")
      .lean();

    const assessmentIds = assessments.map((a) => a._id);
    const assignmentSubmissions = assessmentIds.length
      ? await Submission.find({
          assessment: { $in: assessmentIds },
          student: studentId,
        })
          .select("assessment score feedback gradedAt submittedAt submissionText")
          .lean()
      : [];

    const assignmentMap = assignmentSubmissions.reduce((acc, item) => {
      acc[item.assessment.toString()] = item;
      return acc;
    }, {});

    const assignments = assessments.map((assessment) => {
      const submission = assignmentMap[assessment._id.toString()];
      const graded = !!submission?.gradedAt;
      const submitted = !!submission?.submittedAt;

      return {
        assessmentId: assessment._id,
        title: assessment.title,
        description: assessment.description || "",
        dueDate: assessment.dueDate,
        totalMarks: assessment.totalMarks,
        submitted,
        submittedAt: submission?.submittedAt || null,
        score: submission?.score ?? null,
        gradedAt: submission?.gradedAt || null,
        feedback: submission?.feedback || "",
        status: graded ? "graded" : submitted ? "submitted" : "pending",
      };
    });

    const quizzes = await Quiz.find({ courseId, isActive: true })
      .select("_id title passingScore questionCount")
      .lean();

    const quizIds = quizzes.map((q) => q._id);
    const quizAttempts = quizIds.length
      ? await QuizAttempt.find({
          quizId: { $in: quizIds },
          studentId,
        })
          .select("quizId score correctAnswers totalQuestions status completedAt")
          .sort({ completedAt: -1 })
          .lean()
      : [];

    const quizAttemptMap = quizAttempts.reduce((acc, attempt) => {
      const key = attempt.quizId.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(attempt);
      return acc;
    }, {});

    const quizDetails = quizzes.map((quiz) => {
      const attempts = quizAttemptMap[quiz._id.toString()] || [];
      const latest = attempts[0] || null;
      return {
        quizId: quiz._id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        questionCount: quiz.questionCount,
        attemptsCount: attempts.length,
        latestScore: latest?.score ?? null,
        latestStatus: latest?.status || null,
        latestCompletedAt: latest?.completedAt || null,
        attempts: attempts.map((a) => ({
          score: a.score,
          correctAnswers: a.correctAnswers,
          totalQuestions: a.totalQuestions,
          status: a.status,
          completedAt: a.completedAt,
        })),
      };
    });

    // Analyze weak topics from student's quiz attempts
    const weakTopics = {};
    const topicStats = {};

    if (quizIds.length > 0) {
      const allQuizzesWithQuestions = await Quiz.find({ _id: { $in: quizIds }, isActive: true })
        .select("_id questions")
        .lean();

      const quizQuestionsMap = allQuizzesWithQuestions.reduce((acc, quiz) => {
        acc[quiz._id.toString()] = quiz.questions || [];
        return acc;
      }, {});

      const detailedAttempts = await QuizAttempt.find({
        quizId: { $in: quizIds },
        studentId,
      })
        .select("quizId answers score status")
        .lean();

      detailedAttempts.forEach((attempt) => {
        const quizId = attempt.quizId.toString();
        const questions = quizQuestionsMap[quizId] || [];

        (attempt.answers || []).forEach((answer) => {
          const question = questions[answer.questionIndex];
          if (question) {
            const topic = question.topic || "General";

            if (!topicStats[topic]) {
              topicStats[topic] = {
                total: 0,
                correct: 0,
                percentage: 0,
                questions: []
              };
            }

            topicStats[topic].total += 1;
            if (answer.isCorrect) {
              topicStats[topic].correct += 1;
            } else {
              topicStats[topic].questions.push(question.question);
            }
          }
        });
      });

      Object.keys(topicStats).forEach((topic) => {
        const stats = topicStats[topic];
        stats.percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        if (stats.percentage < 70) {
          weakTopics[topic] = stats;
        }
      });
    }


  } catch (error) {
    console.error("[Enrollment] getStudentCourseDetails error:", error.message || error);
    return res.status(500).json({ message: "Failed to retrieve student course details." });
  }
};

/**
 * Check if a student is enrolled in a course (utility function)
 * Used by other controllers for authorization
 */
export const isStudentEnrolled = async (studentId, courseId) => {
  try {
    const enrollment = await StudentEnrollment.findOne({
      student: studentId,
      course: courseId,
    });
    return !!enrollment;
  } catch (error) {
    console.error("[Enrollment] isStudentEnrolled error:", error.message);
    return false;
  }
};

/**
 * Get detailed performance for the logged-in student in a course
 * GET /api/enrollments/my-course/:courseId/details
 */
export const getMyCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user?._id;

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required." });
    }

    if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Only students can view this data." });
    }

    const enrollment = await StudentEnrollment.findOne({
      course: courseId,
      student: studentId,
    })
      .populate("course", "courseCode title")
      .lean();

    if (!enrollment) {
      return res.status(404).json({ message: "You are not enrolled in this course." });
    }

    const assessments = await Assessment.find({ course: courseId })
      .select("_id title description dueDate totalMarks")
      .lean();

    const assessmentIds = assessments.map((a) => a._id);
    const assignmentSubmissions = assessmentIds.length
      ? await Submission.find({
          assessment: { $in: assessmentIds },
          student: studentId,
        })
          .select("assessment score feedback gradedAt submittedAt submissionText")
          .lean()
      : [];

    const assignmentMap = assignmentSubmissions.reduce((acc, item) => {
      acc[item.assessment.toString()] = item;
      return acc;
    }, {});

    const assignments = assessments.map((assessment) => {
      const submission = assignmentMap[assessment._id.toString()];
      const graded = !!submission?.gradedAt;
      const submitted = !!submission?.submittedAt;

      return {
        assessmentId: assessment._id,
        title: assessment.title,
        description: assessment.description || "",
        dueDate: assessment.dueDate,
        totalMarks: assessment.totalMarks,
        submitted,
        submittedAt: submission?.submittedAt || null,
        score: submission?.score ?? null,
        gradedAt: submission?.gradedAt || null,
        feedback: submission?.feedback || "",
        status: graded ? "graded" : submitted ? "submitted" : "pending",
      };
    });

    const quizzes = await Quiz.find({ courseId, isActive: true })
      .select("_id title passingScore questionCount")
      .lean();

    const quizIds = quizzes.map((q) => q._id);
    const quizAttempts = quizIds.length
      ? await QuizAttempt.find({
          quizId: { $in: quizIds },
          studentId,
        })
          .select("quizId score correctAnswers totalQuestions status completedAt")
          .sort({ completedAt: -1 })
          .lean()
      : [];

    const quizAttemptMap = quizAttempts.reduce((acc, attempt) => {
      const key = attempt.quizId.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(attempt);
      return acc;
    }, {});

    const quizDetails = quizzes.map((quiz) => {
      const attempts = quizAttemptMap[quiz._id.toString()] || [];
      const latest = attempts[0] || null;
      return {
        quizId: quiz._id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        questionCount: quiz.questionCount,
        attemptsCount: attempts.length,
        latestScore: latest?.score ?? null,
        latestStatus: latest?.status || null,
        latestCompletedAt: latest?.completedAt || null,
        attempts: attempts.map((a) => ({
          score: a.score,
          correctAnswers: a.correctAnswers,
          totalQuestions: a.totalQuestions,
          status: a.status,
          completedAt: a.completedAt,
        })),
      };
    });

    const assignmentTotal = assignments.length;
    const assignmentSubmitted = assignments.filter((a) => a.submitted).length;
    const gradedAssignments = assignments.filter((a) => a.score !== null);
    const averageAssignmentScore = gradedAssignments.length
      ? Math.round(gradedAssignments.reduce((sum, a) => sum + (a.score || 0), 0) / gradedAssignments.length)
      : 0;

    const quizAttemptsCount = quizAttempts.length;
    const averageQuizScore = quizAttemptsCount
      ? Math.round(quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / quizAttemptsCount)
      : 0;

    const assignmentCompletion = assignmentTotal
      ? Math.round((assignmentSubmitted / assignmentTotal) * 100)
      : 0;

    const performanceScore = assignmentTotal
      ? Math.round((assignmentCompletion + averageQuizScore) / 2)
      : averageQuizScore;

    // Analyze weak topics from quiz attempts
    const weakTopics = {};
    const topicStats = {};
    const quizInfoMap = quizzes.reduce((acc, quiz, index) => {
      acc[quiz._id.toString()] = {
        title: quiz.title,
        number: index + 1,
      };
      return acc;
    }, {});

    if (quizIds.length > 0) {
      const allQuizzesWithQuestions = await Quiz.find({ _id: { $in: quizIds }, isActive: true })
        .select("_id questions")
        .lean();

      const quizQuestionsMap = allQuizzesWithQuestions.reduce((acc, quiz) => {
        acc[quiz._id.toString()] = quiz.questions || [];
        return acc;
      }, {});

      const detailedAttempts = await QuizAttempt.find({
        quizId: { $in: quizIds },
        studentId,
      })
        .select("quizId answers score status")
        .lean();

      detailedAttempts.forEach((attempt) => {
        const quizId = attempt.quizId.toString();
        const questions = quizQuestionsMap[quizId] || [];
        const quizInfo = quizInfoMap[quizId];
        const quizLabel = quizInfo ? `Quiz ${quizInfo.number}: ${quizInfo.title}` : `Quiz`;

        (attempt.answers || []).forEach((answer) => {
          const question = questions[answer.questionIndex];
          if (question) {
            const topic = question.topic || "General";
            const topicKey = `${quizId}__${topic}`;

            if (!topicStats[topicKey]) {
              topicStats[topicKey] = {
                total: 0,
                correct: 0,
                percentage: 0,
                quizzes: [],
                topic,
                quizLabel,
                wrongQuestions: [],
              };
            }

            topicStats[topicKey].total += 1;
            if (!topicStats[topicKey].quizzes.includes(quizLabel)) {
              topicStats[topicKey].quizzes.push(quizLabel);
            }
            if (answer.isCorrect) {
              topicStats[topicKey].correct += 1;
            } else {
              const questionText = question.question || `Question ${answer.questionIndex + 1}`;
              if (!topicStats[topicKey].wrongQuestions.includes(questionText)) {
                topicStats[topicKey].wrongQuestions.push(questionText);
              }
            }
          }
        });
      });

      // Calculate percentages and identify weak topics
      Object.keys(topicStats).forEach((topicKey) => {
        const stats = topicStats[topicKey];
        stats.percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        if (stats.percentage < 70) {
          weakTopics[topicKey] = stats;
        }
      });
    }

    const weakTopicList = Object.keys(weakTopics).map((topicKey) => ({
      topic: weakTopics[topicKey].topic,
      quizLabel: weakTopics[topicKey].quizLabel,
      displayLabel: `${weakTopics[topicKey].quizLabel} • ${weakTopics[topicKey].topic}`,
      percentage: weakTopics[topicKey].percentage,
      totalQuestions: weakTopics[topicKey].total,
      correctAnswers: weakTopics[topicKey].correct,
      quizzes: weakTopics[topicKey].quizzes || [],
      wrongQuestions: weakTopics[topicKey].wrongQuestions || [],
    }));

    return res.status(200).json({
      message: "Course performance retrieved successfully.",
      course: enrollment.course,
      summary: {
        assignmentTotal,
        assignmentSubmitted,
        averageAssignmentScore,
        quizAttempts: quizAttemptsCount,
        averageQuizScore,
        performanceScore,
        weakTopics: weakTopicList,
      },
      weakTopics: weakTopicList,
      assignments,
      quizzes: quizDetails,
    });
  } catch (error) {
    console.error("[Enrollment] getMyCourseDetails error:", error.message || error);
    return res.status(500).json({ message: "Failed to retrieve course performance." });
  }
};
