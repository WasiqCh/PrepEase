import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import CourseMaterial from "../models/CourseMaterial.js";
import Course from "../models/Course.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import { generateQuiz as generateQuizWithGemini } from "../services/geminiService.js";

/**
 * Generate Quiz from Material
 * POST /api/quizzes/generate
 */
export const generateQuiz = async (req, res) => {
  try {
    const { materialId, difficulty = "medium", questionCount = 5 } = req.body;
    const userId = req.user._id;

    // Validation
    if (!materialId) {
      return res.status(400).json({
        message: "materialId is required.",
      });
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({
        message: "difficulty must be easy, medium, or hard.",
      });
    }

    if (questionCount < 1 || questionCount > 20) {
      return res.status(400).json({
        message: "questionCount must be between 1 and 20.",
      });
    }

    // Check if material exists
    const material = await CourseMaterial.findById(materialId)
      .populate("course")
      .lean();

    if (!material) {
      return res.status(404).json({
        message: "Material not found.",
      });
    }

    // Check if material has extracted text
    if (!material.extractedText || material.extractedText.trim().length === 0) {
      return res.status(400).json({
        message: "Material text is not available. Please re-upload the material.",
      });
    }

    // Authorization: Only teachers can generate quizzes
    if (req.user.role !== "Teacher") {
      return res.status(403).json({
        message: "Only teachers can generate quizzes.",
      });
    }

    // Check if teacher owns the course
    const course = await Course.findById(material.course._id || material.course);
    if (!course || !course.teachers.some((id) => id.toString() === userId.toString())) {
      return res.status(403).json({
        message: "You can only generate quizzes for your own courses.",
      });
    }

    // Generate quiz using Gemini
    try {
      console.log(`[Quiz] Generating quiz for material ${materialId} with Gemini AI`);

      const quizData = await generateQuizWithGemini(
        material.extractedText,
        difficulty,
        questionCount
      );

      const aiQuestions = quizData.questions;

      if (!aiQuestions || aiQuestions.length === 0) {
        return res.status(500).json({
          message: "AI service returned no questions.",
        });
      }

      // Remove duplicates based on question text
      const uniqueQuestions = [];
      const seenQuestions = new Set();

      for (const q of aiQuestions) {
        const normalizedQuestion = q.question.toLowerCase().trim();
        if (!seenQuestions.has(normalizedQuestion)) {
          seenQuestions.add(normalizedQuestion);
          uniqueQuestions.push(q);
        }
      }

      if (uniqueQuestions.length === 0) {
        return res.status(500).json({
          message: "Failed to generate unique questions.",
        });
      }

      // Save quiz to MongoDB
      const quiz = await Quiz.create({
        materialId,
        courseId: course._id,
        createdBy: userId,
        title: `Quiz: ${material.title}`,
        difficulty,
        questions: uniqueQuestions,
        questionCount: uniqueQuestions.length,
        generatedBy: "AI",
      });

      console.log(`[Quiz] Quiz ${quiz._id} created successfully`);

      return res.status(201).json({
        success: true,
        message: "Quiz generated successfully.",
        quiz: {
          _id: quiz._id,
          title: quiz.title,
          difficulty: quiz.difficulty,
          questionCount: quiz.questionCount,
          questions: quiz.questions,
          materialTitle: material.title,
          createdAt: quiz.createdAt,
        },
      });
    } catch (aiError) {
      console.error("[Quiz] Gemini AI error:", aiError.message);

      return res.status(500).json({
        message: "Failed to generate quiz using AI.",
        error: aiError.message,
      });
    }
  } catch (error) {
    console.error("[Quiz] Error:", error.message);
    return res.status(500).json({
      message: "Failed to generate quiz.",
      error: error.message,
    });
  }
};

/**
 * Get quizzes for a material
 * GET /api/quizzes/material/:materialId
 */
export const getQuizzesByMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const userId = req.user._id;

    const material = await CourseMaterial.findById(materialId).populate("course");
    if (!material) {
      return res.status(404).json({
        message: "Material not found.",
      });
    }

    // Authorization check
    if (req.user.role === "Student") {
      // Students must be enrolled to access quizzes
      const isEnrolled = await StudentEnrollment.findOne({
        student: userId,
        course: material.course._id || material.course,
      });

      if (!isEnrolled) {
        return res.status(403).json({
          message: "You must be enrolled in this course to access quizzes.",
        });
      }
    } else if (req.user.role === "Teacher") {
      // Teachers can only access quizzes from their own courses
      const course = await Course.findById(material.course._id || material.course);
      if (course && !course.teachers.some((id) => id.toString() === userId.toString())) {
        return res.status(403).json({
          message: "You do not have access to this material.",
        });
      }
    }

    const quizzes = await Quiz.find({
      materialId,
      isActive: true,
    })
      .populate("createdBy", "email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      quizzes,
    });
  } catch (error) {
    console.error("[Quiz] Error fetching quizzes:", error.message);
    return res.status(500).json({
      message: "Failed to fetch quizzes.",
      error: error.message,
    });
  }
};

/**
 * Get a single quiz by ID
 * GET /api/quizzes/:quizId
 */
export const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user._id;

    const quiz = await Quiz.findById(quizId)
      .populate("materialId", "title fileName")
      .populate("courseId", "title courseCode")
      .populate("createdBy", "email")
      .lean();

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found.",
      });
    }

    // Authorization check
    if (req.user.role === "Student") {
      // Students must be enrolled to access quizzes
      const isEnrolled = await StudentEnrollment.findOne({
        student: userId,
        course: quiz.courseId._id || quiz.courseId,
      });

      if (!isEnrolled) {
        return res.status(403).json({
          message: "You must be enrolled in this course to access this quiz.",
        });
      }
    } else if (req.user.role === "Teacher") {
      // Teachers can only access quizzes from their own courses
      const course = await Course.findById(quiz.courseId._id || quiz.courseId);
      if (course && !course.teachers.some((id) => id.toString() === userId.toString())) {
        return res.status(403).json({
          message: "You do not have access to this quiz.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error("[Quiz] Error fetching quiz:", error.message);
    return res.status(500).json({
      message: "Failed to fetch quiz.",
      error: error.message,
    });
  }
};

/**
 * Delete a quiz
 * DELETE /api/quizzes/:quizId
 */
export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found.",
      });
    }

    // Only teacher who created the quiz can delete it
    if (req.user.role !== "Teacher") {
      return res.status(403).json({
        message: "Only teachers can delete quizzes.",
      });
    }

    if (quiz.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You can only delete quizzes you created.",
      });
    }

    // Soft delete (mark as inactive)
    quiz.isActive = false;
    await quiz.save();

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully.",
    });
  } catch (error) {
    console.error("[Quiz] Error deleting quiz:", error.message);
    return res.status(500).json({
      message: "Failed to delete quiz.",
      error: error.message,
    });
  }
};

/**
 * Create Quiz Manually
 * POST /api/quizzes
 */
export const createQuiz = async (req, res) => {
  try {
    const {
      courseId,
      materialId,
      title,
      description,
      timeLimit,
      passingScore,
      showAnswers,
      shuffleQuestions,
      questions,
    } = req.body;
    const userId = req.user._id;

    // Validation
    if (!courseId || !title || !questions || questions.length === 0) {
      return res.status(400).json({
        message: "courseId, title, and questions are required.",
      });
    }

    if (req.user.role !== "Teacher") {
      return res.status(403).json({
        message: "Only teachers can create quizzes.",
      });
    }

    // Check course exists and user is teacher
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    if (!course.teachers.some((id) => id.toString() === userId.toString())) {
      return res.status(403).json({
        message: "You can only create quizzes for your own courses.",
      });
    }

    // Create quiz
    const newQuiz = new Quiz({
      courseId,
      materialId: materialId || null, // Optional for manual quizzes
      title,
      description: description || "",
      timeLimit: timeLimit || 30,
      passingScore: passingScore || 70,
      showAnswers: showAnswers !== false,
      shuffleQuestions: shuffleQuestions !== false,
      questions: questions.map((q, index) => ({
        order: index,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || 0,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
      })),
      questionCount: questions.length,
      createdBy: userId,
      isActive: true,
      generatedBy: "Manual",
    });

    await newQuiz.save();

    return res.status(201).json({
      success: true,
      message: "Quiz created successfully.",
      quiz: newQuiz,
    });
  } catch (error) {
    console.error("[Quiz] Error creating quiz:", error.message);
    return res.status(500).json({
      message: "Failed to create quiz.",
      error: error.message,
    });
  }
};

/**
 * Get all quizzes for a course
 * GET /api/quizzes/course/:courseId
 */
export const getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    // Authorization check for teachers
    if (req.user.role === "Teacher") {
      if (!course.teachers.some((id) => id.toString() === req.user._id.toString())) {
        return res.status(403).json({
          message: "You do not have access to this course.",
        });
      }
    }

    const quizzes = await Quiz.find({
      courseId,
      isActive: true,
    })
      .populate("materialId", "title fileName")
      .populate("createdBy", "email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      quizzes,
    });
  } catch (error) {
    console.error("[Quiz] Error fetching course quizzes:", error.message);
    return res.status(500).json({
      message: "Failed to fetch quizzes.",
      error: error.message,
    });
  }
};

/**
 * Get quiz attempt summary for a course (Teacher only)
 * GET /api/quizzes/course/:courseId/attempts-summary
 */
export const getQuizAttemptSummaryByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    if (req.user.role !== "Teacher") {
      return res.status(403).json({
        message: "Only teachers can view quiz attempt summaries.",
      });
    }

    if (!course.teachers.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        message: "You do not have access to this course.",
      });
    }

    const summary = await QuizAttempt.aggregate([
      { $match: { courseId: course._id } },
      {
        $group: {
          _id: "$quizId",
          attemptsCount: { $sum: 1 },
          averageScore: { $avg: "$score" },
        },
      },
      {
        $project: {
          _id: 0,
          quizId: "$_id",
          attemptsCount: 1,
          averageScore: { $round: ["$averageScore", 0] },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("[Quiz] Error fetching attempt summary:", error.message);
    return res.status(500).json({
      message: "Failed to fetch quiz attempt summary.",
      error: error.message,
    });
  }
};

/**
 * Submit Quiz Attempt
 * POST /api/quizzes/:quizId/submit
 */
export const submitQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeTaken } = req.body;
    const studentId = req.user._id;

    // Validation
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "answers array is required.",
      });
    }

    if (typeof timeTaken !== "number") {
      return res.status(400).json({
        message: "timeTaken (in seconds) is required.",
      });
    }

    // Get quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found.",
      });
    }

    // Prevent re-attempts
    const existingAttempt = await QuizAttempt.findOne({
      quizId,
      studentId,
    })
      .sort({ completedAt: -1 })
      .lean();

    if (existingAttempt) {
      return res.status(409).json({
        message: "You have already attempted this quiz.",
        attempt: existingAttempt,
      });
    }

    // Authorization: only students enrolled in the course can submit
    const isEnrolled = await StudentEnrollment.findOne({
      student: studentId,
      course: quiz.courseId,
    });

    if (!isEnrolled) {
      return res.status(403).json({
        message: "You must be enrolled in this course to attempt this quiz.",
      });
    }

    // Calculate score
    let correctAnswers = 0;
    const processedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[index];
      const isCorrect = question && question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) {
        correctAnswers++;
      }

      return {
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: isCorrect || false,
        timeSpent: answer.timeSpent || 0,
      };
    });

    const score = Math.round((correctAnswers / quiz.questionCount) * 100);
    const passed = score >= quiz.passingScore;

    // Create attempt record
    const attempt = new QuizAttempt({
      quizId,
      studentId,
      courseId: quiz.courseId,
      answers: processedAnswers,
      score,
      totalQuestions: quiz.questionCount,
      correctAnswers,
      status: passed ? "passed" : "failed",
      timeTaken,
      startedAt: new Date(Date.now() - timeTaken * 1000),
      completedAt: new Date(),
    });

    await attempt.save();

    return res.status(201).json({
      success: true,
      message: "Quiz submitted successfully.",
      attempt: {
        _id: attempt._id,
        score,
        correctAnswers,
        totalQuestions: quiz.questionCount,
        status: attempt.status,
        timeTaken,
        passed,
        passingScore: quiz.passingScore,
      },
    });
  } catch (error) {
    console.error("[Quiz] Error submitting quiz:", error.message);
    return res.status(500).json({
      message: "Failed to submit quiz.",
      error: error.message,
    });
  }
};

/**
 * Get Quiz Attempts for Student
 * GET /api/quizzes/:quizId/attempts
 */
export const getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user._id;

    // Get quiz first
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found.",
      });
    }

    let attemptsQuery = { quizId };

    if (req.user.role === "Student") {
      attemptsQuery = { quizId, studentId };
    } else if (req.user.role === "Teacher") {
      const course = await Course.findById(quiz.courseId);
      if (!course || !course.teachers.some((id) => id.toString() === studentId.toString())) {
        return res.status(403).json({
          message: "You do not have access to this quiz.",
        });
      }
    }

    const attempts = await QuizAttempt.find(attemptsQuery)
      .populate("studentId", "email firstName lastName")
      .sort({ completedAt: -1 })
      .lean();

    const totalAttempts = attempts.length;
    const averageScore = totalAttempts
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts)
      : 0;

    return res.status(200).json({
      success: true,
      attempts,
      totalAttempts,
      averageScore,
    });
  } catch (error) {
    console.error("[Quiz] Error fetching attempts:", error.message);
    return res.status(500).json({
      message: "Failed to fetch quiz attempts.",
      error: error.message,
    });
  }
};
