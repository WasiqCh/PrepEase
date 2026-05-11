import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import axios from "axios";
import Course from "../models/Course.js";
import CourseMaterial from "../models/CourseMaterial.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import { extractPDFText, ingestMaterialToAI } from "../utils/aiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_STUDY_BUDDY_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Ensure uploads directory exists (backend/uploads)
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${baseName}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF or PPT files are allowed."));
  }
};

export const upload = multer({ storage, fileFilter });

export const uploadMaterial = async (req, res) => {
  try {
    const { courseId, title } = req.body;
    const userId = req.user._id;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required." });
    }

    if (!title) {
      return res.status(400).json({ message: "title is required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required." });
    }

    const course = mongoose.Types.ObjectId.isValid(courseId)
      ? await Course.findById(courseId)
      : await Course.findOne({ courseCode: courseId });
    if (!course) {
      return res.status(400).json({ message: "Invalid course ID. Please check the course code." });
    }

    // Authorization: Teachers can only upload to their assigned courses
    if (req.user.role === "Teacher") {
      if (!course.teachers.includes(userId)) {
        return res.status(403).json({
          message: "You are not assigned to this course. Contact your administrator.",
        });
      }
    }

    const fileType = req.file.mimetype.includes("pdf") ? "PDF" : "PPT";
    const fileUrl = `/uploads/${req.file.filename}`;

    const material = await CourseMaterial.create({
      course: course._id,
      userId,
      title,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileUrl,
      fileType,
      status: "Processing",
      materialType: "lecture",
      uploadedBy: userId,
    });

    // Process PDF in background (non-blocking)
    if (fileType === "PDF") {
      processPDFAsync(material);
    } else {
      // For PPT, mark as ready without AI processing
      material.status = "Ready";
      await material.save();
    }

    return res.status(201).json({
      message: "Lecture uploaded successfully.",
      material,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Upload failed." });
  }
};

/**
 * Process PDF asynchronously - extract text and send to AI service
 * @param {Object} material - CourseMaterial document
 */
async function processPDFAsync(material) {
  try {
    // Extract text from PDF
    console.log(`[Processing] Extracting text from: ${material.filePath}`);
    const extractedText = await extractPDFText(material.filePath);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("No text content extracted from PDF");
    }

    // Save extracted text to material
    material.extractedText = extractedText;
    material.status = "Ready";
    await material.save();

    console.log(`[Gemini] Material ${material._id} ready for AI features. Text length: ${extractedText.length} characters`);

  } catch (error) {
    console.error(`[Processing] Failed for material ${material._id}:`, error.message);
    
    material.status = "Failed";
    await material.save();
  }
}

export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const material = await CourseMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ message: "Material not found." });
    }

    // Check if user owns the material
    if (material.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You do not have permission to delete this material." });
    }

    // Delete file from disk
    if (fs.existsSync(material.filePath)) {
      fs.unlinkSync(material.filePath);
    }

    // Delete from database
    await CourseMaterial.findByIdAndDelete(id);

    return res.status(200).json({ message: "Material deleted successfully." });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to delete material." });
  }
};

export const getCourseMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Authorization check
    if (req.user.role === "Student") {
      // Students must be enrolled to access course materials
      const isEnrolled = await StudentEnrollment.findOne({
        student: userId,
        course: courseId,
      });

      if (!isEnrolled) {
        return res.status(403).json({
          message: "You must be enrolled in this course to access its materials.",
        });
      }
    } else if (req.user.role === "Teacher") {
      // Teachers can only access materials from their own courses
      if (!course.teachers.some((id) => id.toString() === userId.toString())) {
        return res.status(403).json({
          message: "You can only access materials from your own courses.",
        });
      }
    }

    const materials = await CourseMaterial.find({ course: courseId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ materials });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to load materials." });
  }
};

export const getAllMaterials = async (req, res) => {
  try {
    const userId = req.user._id;

    let query = {};

    // For students, return only materials from enrolled courses
    if (req.user.role === "Student") {
      const enrollments = await StudentEnrollment.find({
        student: userId,
      }).select("course");

      const courseIds = enrollments.map((e) => e.course);
      query = { course: { $in: courseIds } };
    }
    // For teachers, return only their own course materials
    else if (req.user.role === "Teacher") {
      const courses = await Course.find({
        teachers: userId,
      }).select("_id");

      const courseIds = courses.map((c) => c._id);
      query = { course: { $in: courseIds } };
    }
    // For admins, return all materials (no query filter)

    const materials = await CourseMaterial.find(query)
      .populate("course", "courseCode title teachers")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ materials });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to load materials." });
  }
};

export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const material = await CourseMaterial.findById(id)
      .populate("course", "courseCode title teachers")
      .lean();

    if (!material) {
      return res.status(404).json({ message: "Material not found." });
    }

    // Authorization check
    if (req.user.role === "Student") {
      // Students must be enrolled to access materials
      const isEnrolled = await StudentEnrollment.findOne({
        student: userId,
        course: material.course._id,
      });

      if (!isEnrolled) {
        return res.status(403).json({
          message: "You must be enrolled in this course to access this material.",
        });
      }
    } else if (req.user.role === "Teacher") {
      // Teachers can only access materials from their own courses
      const course = material.course;
      if (!course.teachers.some((id) => id.toString() === userId.toString())) {
        return res.status(403).json({
          message: "You can only access materials from your own courses.",
        });
      }
    }

    return res.status(200).json({ material });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to load material." });
  }
};
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { title } = req.body;

    const material = await CourseMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ message: "Material not found." });
    }

    // Check if user owns the material
    if (material.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You do not have permission to update this material." });
    }

    // If file is being replaced
    if (req.file) {
      // Delete old file from disk
      if (fs.existsSync(material.filePath)) {
        fs.unlinkSync(material.filePath);
      }

      const fileType = req.file.mimetype.includes("pdf") ? "PDF" : "PPT";
      const fileUrl = `/uploads/${req.file.filename}`;

      // Update material with new file
      material.fileName = req.file.originalname;
      material.filePath = req.file.path;
      material.fileUrl = fileUrl;
      material.fileType = fileType;
      material.status = "Processing";
      material.extractedText = "";

      // Process PDF in background if new file is PDF
      if (fileType === "PDF") {
        processPDFAsync(material);
      } else {
        // For PPT, mark as ready without AI processing
        material.status = "Ready";
        await material.save();
      }
    } else {
      // Just update title
      if (title) {
        material.title = title;
        await material.save();
      }
    }

    return res.status(200).json({
      message: "Material updated successfully.",
      material,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to update material." });
  }
};