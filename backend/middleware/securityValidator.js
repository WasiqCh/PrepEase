/**
 * Security Validation Middleware
 * Provides comprehensive input validation and sanitization using express-validator
 * Prevents: XSS, SQL injection, malformed requests, invalid file types
 */

import { body, param, query, validationResult } from "express-validator";
import mongoose from "mongoose";

/**
 * Error handler for express-validator
 * Formats validation errors consistently
 */
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value !== undefined ? "[REDACTED]" : undefined,
      })),
    });
  }
  return next();
};

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validate email format
 * - RFC 5322 compliant
 * - Normalizes to lowercase
 * - Trims whitespace
 */
export const validateEmail = body("email")
  .trim()
  .toLowerCase()
  .isEmail()
  .withMessage("Please provide a valid email address.")
  .normalizeEmail();

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (!@#$%^&*)
 */
export const validatePasswordStrength = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters.")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter.")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter.")
  .matches(/\d/)
  .withMessage("Password must contain at least one number.")
  .matches(/[!@#$%^&*]/)
  .withMessage("Password must contain at least one special character (!@#$%^&*).");

/**
 * Validate password confirmation matches
 */
export const validatePasswordMatch = body("passwordConfirm")
  .custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match.");
    }
    return true;
  });

// ============================================================================
// MONGODB OBJECTID VALIDATION
// ============================================================================

/**
 * Validate MongoDB ObjectId format
 * Prevents invalid document queries
 * Usage: param("courseId").custom(validateObjectId)
 */
export const validateObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ID format. Expected MongoDB ObjectId, got: ${value}`);
  }
  return true;
};

/**
 * Reusable validators for common ObjectId parameters
 */
export const validateCourseId = param("courseId")
  .custom(validateObjectId)
  .withMessage("Invalid course ID format.");

export const validateMaterialId = param("materialId")
  .custom(validateObjectId)
  .withMessage("Invalid material ID format.");

export const validateQuizId = param("quizId")
  .custom(validateObjectId)
  .withMessage("Invalid quiz ID format.");

export const validateUserId = param("userId")
  .custom(validateObjectId)
  .withMessage("Invalid user ID format.");

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validate file MIME type
 * Allowed types: PDF, PPT, PPTX
 * Usage: body("file").custom(validateFileMimeType)
 */
export const validateFileMimeType = (value, { req }) => {
  if (!req.file) {
    throw new Error("File is required.");
  }

  const allowedMimes = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  if (!allowedMimes.includes(req.file.mimetype)) {
    throw new Error(
      `Invalid file type. Allowed: PDF, PPT, PPTX. Got: ${req.file.mimetype}`
    );
  }

  return true;
};

/**
 * Validate file size
 * Max size: 50MB
 * Usage: body("file").custom(validateFileSize)
 */
export const validateFileSize = (value, { req }) => {
  if (!req.file) {
    throw new Error("File is required.");
  }

  const maxSize = 50 * 1024 * 1024; // 50MB

  if (req.file.size > maxSize) {
    throw new Error(
      `File too large. Max size: 50MB, got: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`
    );
  }

  return true;
};

/**
 * Sanitize filename
 * - Removes special characters except . - _
 * - Converts spaces to hyphens
 * - Converts to lowercase
 * - Trims length to 255 characters
 */
export const sanitizeFilename = (filename) => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "") // Keep only alphanumeric, dot, hyphen, underscore
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .slice(0, 255); // Limit to 255 characters
};

// ============================================================================
// TEXT VALIDATION (XSS PREVENTION)
// ============================================================================

/**
 * Sanitize text input to prevent XSS
 * - Removes HTML/script tags
 * - Escapes special characters
 * - Trims whitespace
 * - Limits length
 */
export const sanitizeText = (text, maxLength = 1000) => {
  if (typeof text !== "string") return "";
  
  return text
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>"'&]/g, (char) => {
      const entities = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return entities[char] || char;
    });
};

/**
 * Validate and sanitize title field
 * - Max 200 characters
 * - Trim whitespace
 * - Prevent XSS
 */
export const validateTitle = body("title")
  .trim()
  .isLength({ min: 1, max: 200 })
  .withMessage("Title must be between 1 and 200 characters.")
  .matches(/^[a-zA-Z0-9\s\-_.(),!?:&]*$/)
  .withMessage("Title contains invalid characters.")
  .customSanitizer((value) => sanitizeText(value, 200));

/**
 * Validate and sanitize description field
 * - Max 5000 characters
 * - Trim whitespace
 * - Prevent XSS
 */
export const validateDescription = body("description")
  .optional({ checkFalsy: true })
  .trim()
  .isLength({ max: 5000 })
  .withMessage("Description must not exceed 5000 characters.")
  .customSanitizer((value) => sanitizeText(value, 5000));

/**
 * Validate and sanitize question field (for chat/quiz)
 * - Min 3 characters
 * - Max 2000 characters
 * - Prevent XSS
 */
export const validateQuestion = body("question")
  .trim()
  .isLength({ min: 3, max: 2000 })
  .withMessage("Question must be between 3 and 2000 characters.")
  .customSanitizer((value) => sanitizeText(value, 2000));

// ============================================================================
// COURSE VALIDATION
// ============================================================================

/**
 * Validate course code
 * - Alphanumeric only
 * - 2-10 characters
 * - Uppercase
 */
export const validateCourseCode = body("courseCode")
  .trim()
  .toUpperCase()
  .isLength({ min: 2, max: 10 })
  .withMessage("Course code must be between 2 and 10 characters.")
  .matches(/^[A-Z0-9]+$/)
  .withMessage("Course code must contain only uppercase letters and numbers.");

/**
 * Validate course name/title
 * - Max 200 characters
 * - Prevent XSS
 */
export const validateCourseName = body("title")
  .trim()
  .isLength({ min: 1, max: 200 })
  .withMessage("Course name must be between 1 and 200 characters.")
  .customSanitizer((value) => sanitizeText(value, 200));

// ============================================================================
// ENROLLMENT VALIDATION
// ============================================================================

/**
 * Validate course ID in enrollment request
 */
export const validateEnrollmentCourseId = body("courseId")
  .notEmpty()
  .withMessage("Course ID is required.")
  .custom(validateObjectId)
  .withMessage("Invalid course ID format.");

// ============================================================================
// PAGINATION VALIDATION
// ============================================================================

/**
 * Validate pagination parameters
 * - page: positive integer, max 1000
 * - limit: 1-100
 */
export const validatePagination = [
  query("page")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 1000 })
    .withMessage("Page must be a positive integer (1-1000)."),
  query("limit")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100."),
];

// ============================================================================
// COMPOSITE VALIDATORS
// ============================================================================

/**
 * Validate registration request
 * - Email format
 * - Password strength
 * - Password confirmation
 */
export const validateRegistration = [
  validateEmail,
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters.")
    .customSanitizer((value) => sanitizeText(value, 100)),
  validatePasswordStrength,
  validatePasswordMatch,
  handleValidation,
];

/**
 * Validate login request
 * - Email format
 * - Password required
 */
export const validateLogin = [
  validateEmail,
  body("password")
    .notEmpty()
    .withMessage("Password is required."),
  handleValidation,
];

/**
 * Validate password reset request
 * - Email format
 * - New password strength
 * - Confirmation match
 */
export const validatePasswordReset = [
  validateEmail,
  body("resetToken")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required."),
  validatePasswordStrength,
  validatePasswordMatch,
  handleValidation,
];

/**
 * Validate material upload request
 * - Course ID format
 * - Title format
 * - File MIME type
 * - File size
 */
export const validateMaterialUpload = [
  body("courseId")
    .notEmpty()
    .withMessage("Course ID is required.")
    .custom(validateObjectId)
    .withMessage("Invalid course ID format."),
  validateTitle,
  body("file")
    .custom(validateFileMimeType)
    .custom(validateFileSize),
  handleValidation,
];

/**
 * Validate chat request
 * - Material ID format
 * - Question content
 */
export const validateChatRequest = [
  body("materialId")
    .notEmpty()
    .withMessage("Material ID is required.")
    .custom(validateObjectId)
    .withMessage("Invalid material ID format."),
  validateQuestion,
  handleValidation,
];

/**
 * Validate quiz generation request
 * - Material ID format
 * - Difficulty level
 * - Question count
 */
export const validateQuizGeneration = [
  body("materialId")
    .notEmpty()
    .withMessage("Material ID is required.")
    .custom(validateObjectId)
    .withMessage("Invalid material ID format."),
  body("difficulty")
    .optional({ checkFalsy: true })
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty must be: easy, medium, or hard."),
  body("questionCount")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 20 })
    .withMessage("Question count must be between 1 and 20."),
  handleValidation,
];

/**
 * Validate course creation request
 * - Course code format
 * - Course name
 * - Description
 */
export const validateCourseCreation = [
  validateCourseCode,
  validateCourseName,
  validateDescription,
  handleValidation,
];

export default {
  // Error handler
  handleValidation,

  // Individual validators
  validateEmail,
  validatePasswordStrength,
  validatePasswordMatch,
  validateObjectId,
  validateFileMimeType,
  validateFileSize,
  validateTitle,
  validateDescription,
  validateQuestion,
  validateCourseCode,
  validateCourseName,
  validateEnrollmentCourseId,
  validatePagination,

  // Composite validators
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateMaterialUpload,
  validateChatRequest,
  validateQuizGeneration,
  validateCourseCreation,

  // Utility functions
  sanitizeFilename,
  sanitizeText,
};
