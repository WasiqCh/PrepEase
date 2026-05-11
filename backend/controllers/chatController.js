import CourseMaterial from "../models/CourseMaterial.js";
import Course from "../models/Course.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import { studyBuddyChat } from "../services/geminiService.js";

/**
 * AI Study Buddy Chat Endpoint
 * POST /api/chat
 */
export const askQuestion = async (req, res) => {
  try {
    const { materialId, question } = req.body;
    const userId = req.user._id;

    // Validation
    if (!materialId || !question) {
      return res.status(400).json({ 
        message: "materialId and question are required." 
      });
    }

    if (typeof question !== "string" || question.trim().length === 0) {
      return res.status(400).json({ 
        message: "Question must be a non-empty string." 
      });
    }

    // Check if material exists
    const material = await CourseMaterial.findById(materialId)
      .populate("course")
      .lean();

    if (!material) {
      return res.status(404).json({ 
        message: "Material not found." 
      });
    }

    // Check if material is ready for AI processing
    if (material.status !== "Ready") {
      return res.status(400).json({ 
        message: "Material is not yet processed by AI service. Please try again later.",
        status: material.status
      });
    }

    // Check if material has extracted text
    if (!material.extractedText || material.extractedText.trim().length === 0) {
      return res.status(400).json({ 
        message: "Material text is not available. Please re-upload the material.",
        status: material.status
      });
    }

    // Authorization: Check if user has access to this material
    if (req.user.role === "Student") {
      // Students must be enrolled in the course to access materials
      const isEnrolled = await StudentEnrollment.findOne({
        student: userId,
        course: material.course._id || material.course,
      });

      if (!isEnrolled) {
        return res.status(403).json({
          message: "You must be enrolled in this course to access this material.",
        });
      }
    } else if (req.user.role === "Teacher") {
      // Teachers can only access materials from their own courses
      const course = await Course.findById(material.course._id || material.course);
      if (!course || !course.teachers.some((id) => id.toString() === userId.toString())) {
        return res.status(403).json({
          message: "You do not have access to this material.",
        });
      }
    }

    // Use Gemini AI to answer the question
    try {
      console.log(`[Chat] User ${userId} asking about material ${materialId}`);
      
      const answer = await studyBuddyChat(material.extractedText, question.trim());

      console.log(`[Chat] Gemini AI response received for material ${materialId}`);

      return res.status(200).json({
        success: true,
        answer,
        materialId,
        materialTitle: material.title,
      });

    } catch (aiError) {
      console.error("[Chat] Gemini AI error:", aiError.message);

      return res.status(500).json({ 
        message: "Failed to get response from AI service.",
        error: aiError.message
      });
    }

  } catch (error) {
    console.error("[Chat] Error:", error.message);
    return res.status(500).json({ 
      message: "Failed to process chat request.",
      error: error.message
    });
  }
};

/**
 * Legacy sendMessage endpoint (keeping for backward compatibility)
 * This can be removed if not needed
 */
export const sendMessage = async (req, res) => {
  // Redirect to new endpoint
  req.body.question = req.body.message;
  return askQuestion(req, res);
};
