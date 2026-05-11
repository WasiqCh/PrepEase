# Security Validation & Sanitization Guide

## Overview

`securityValidator.js` provides comprehensive input validation and sanitization using `express-validator`. It prevents:
- **XSS** (Cross-Site Scripting)
- **Injection Attacks** (SQL, NoSQL)
- **Malformed Requests**
- **Invalid File Types & Sizes**
- **Invalid ObjectIds**

---

## Quick Start

### Basic Usage Pattern

```javascript
import { 
  validateLogin,
  handleValidation,
  validateEmail,
  validateTitle
} from "../middleware/securityValidator.js";

// Option 1: Use pre-built composite validators
router.post("/login", validateLogin, loginController);

// Option 2: Mix and match individual validators
router.post("/course", [
  protect,
  isTeacher,
  validateCourseCode,
  validateCourseName,
  handleValidation,
], createCourseController);
```

---

## Validation Rules by Category

### 1. Email Validation

**What it does:**
- Validates RFC 5322 email format
- Normalizes to lowercase
- Trims whitespace
- Prevents email enumeration

**Usage:**
```javascript
import { validateEmail, handleValidation } from "../middleware/securityValidator.js";

router.post("/subscribe", [
  validateEmail,
  handleValidation,
], subscribeController);
```

**Example:**
```bash
# ✅ Valid
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!", "name": "John"}'

# ❌ Invalid - returns 400
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "SecurePass123!", "name": "John"}'
```

---

### 2. Password Strength Validation

**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter  
- At least 1 number
- At least 1 special character (!@#$%^&*)

**Usage:**
```javascript
import { validatePasswordStrength, validatePasswordMatch } from "../middleware/securityValidator.js";

router.post("/reset-password", [
  validateEmail,
  validatePasswordStrength,
  validatePasswordMatch,
  handleValidation,
], resetPasswordController);
```

**Example:**
```bash
# ✅ Valid password
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "passwordConfirm": "SecurePass123!",
    "resetToken": "..."
  }'

# ❌ Weak password (missing uppercase)
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123!",
    "passwordConfirm": "securepass123!",
    "resetToken": "..."
  }'
```

**Response (if validation fails):**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter."
    }
  ]
}
```

---

### 3. MongoDB ObjectId Validation

**What it does:**
- Validates MongoDB ObjectId format
- Prevents invalid database queries
- Returns 400 for malformed IDs

**Usage:**
```javascript
import { validateCourseId, handleValidation } from "../middleware/securityValidator.js";

router.get("/materials/:courseId", [
  protect,
  validateCourseId,
  handleValidation,
], getMaterialsController);
```

**Pre-built ObjectId Validators:**
- `validateCourseId` - For `:courseId` parameter
- `validateMaterialId` - For `:materialId` parameter
- `validateQuizId` - For `:quizId` parameter
- `validateUserId` - For `:userId` parameter

**Example:**
```bash
# ✅ Valid ObjectId
curl -X GET http://localhost:5001/api/materials/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer TOKEN"

# ❌ Invalid ObjectId
curl -X GET http://localhost:5001/api/materials/invalid-id \
  -H "Authorization: Bearer TOKEN"
# Returns 400: "Invalid material ID format."
```

---

### 4. File Validation

**MIME Types Allowed:**
- `application/pdf` (PDF)
- `application/vnd.ms-powerpoint` (PPT)
- `application/vnd.openxmlformats-officedocument.presentationml.presentation` (PPTX)

**File Size Limit:** 50MB

**Filename Sanitization:**
- Removes special characters (except . - _)
- Converts spaces to hyphens
- Converts to lowercase
- Limits to 255 characters

**Usage:**
```javascript
import { 
  validateMaterialUpload,
  handleValidation
} from "../middleware/securityValidator.js";

router.post("/upload", [
  protect,
  isTeacher,
  upload.single("file"),
  validateMaterialUpload,
], uploadMaterialController);
```

**Example:**
```bash
# ✅ Valid file upload
curl -X POST http://localhost:5001/api/materials/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "courseId=507f1f77bcf86cd799439011" \
  -F "title=Machine Learning Basics" \
  -F "file=@lecture.pdf"

# ❌ Invalid file type (DOC instead of PDF)
curl -X POST http://localhost:5001/api/materials/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "courseId=507f1f77bcf86cd799439011" \
  -F "title=Machine Learning Basics" \
  -F "file=@document.doc"
# Returns 400: "Invalid file type. Allowed: PDF, PPT, PPTX. Got: application/msword"

# ❌ File too large (>50MB)
curl -X POST http://localhost:5001/api/materials/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "courseId=507f1f77bcf86cd799439011" \
  -F "title=Machine Learning Basics" \
  -F "file=@huge-file.pdf"
# Returns 400: "File too large. Max size: 50MB, got: 75.50MB"
```

---

### 5. Text Input Validation (XSS Prevention)

**What it does:**
- Removes HTML/script tags
- Escapes special characters (<, >, ", ', &)
- Trims whitespace
- Limits length

**Available Validators:**
- `validateTitle` - 200 char limit
- `validateDescription` - 5000 char limit
- `validateQuestion` - 2000 char limit (3-2000 chars)

**Usage:**
```javascript
import { 
  validateTitle,
  validateDescription,
  handleValidation
} from "../middleware/securityValidator.js";

router.post("/courses", [
  protect,
  isTeacher,
  validateCourseCode,
  validateTitle,
  validateDescription,
  handleValidation,
], createCourseController);
```

**Example:**
```bash
# ✅ Valid title
curl -X POST http://localhost:5001/api/courses \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "CS101",
    "title": "Introduction to Computer Science",
    "description": "Learn fundamentals of computer science"
  }'

# ❌ XSS attempt in title (script tag removed)
curl -X POST http://localhost:5001/api/courses \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "CS101",
    "title": "<script>alert(\"XSS\")</script>CS 101",
    "description": "Learn fundamentals"
  }'
# Stored as: "CS 101" (script tags removed)
```

---

### 6. Course Validation

**Validators:**
- `validateCourseCode` - 2-10 alphanumeric, uppercase
- `validateCourseName` - 1-200 characters, XSS protected
- `validateCourseCreation` - Combined validators

**Usage:**
```javascript
import { validateCourseCreation } from "../middleware/securityValidator.js";

router.post("/", [
  protect,
  isTeacher,
  validateCourseCreation,
], createCourseController);
```

**Example:**
```bash
# ✅ Valid
curl -X POST http://localhost:5001/api/courses \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "MATH101",
    "title": "Calculus I",
    "description": "Advanced calculus concepts"
  }'

# ❌ Invalid course code (too long, contains lowercase)
curl -X POST http://localhost:5001/api/courses \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "VeryLongCourseCode123",
    "title": "Calculus I",
    "description": "Advanced calculus concepts"
  }'
# Returns 400: "Course code must be between 2 and 10 characters."
```

---

### 7. Chat Request Validation

**Validates:**
- Material ID format (MongoDB ObjectId)
- Question content (3-2000 chars, XSS protected)

**Usage:**
```javascript
import { validateChatRequest } from "../middleware/securityValidator.js";

router.post("/", [
  protect,
  validateChatRequest,
], askQuestionController);
```

**Example:**
```bash
# ✅ Valid
curl -X POST http://localhost:5001/api/chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "507f1f77bcf86cd799439011",
    "question": "What is the importance of photosynthesis?"
  }'

# ❌ Question too short
curl -X POST http://localhost:5001/api/chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "507f1f77bcf86cd799439011",
    "question": "Hi"
  }'
# Returns 400: "Question must be between 3 and 2000 characters."
```

---

### 8. Quiz Generation Validation

**Validates:**
- Material ID format
- Difficulty level (easy | medium | hard)
- Question count (1-20)

**Usage:**
```javascript
import { validateQuizGeneration } from "../middleware/securityValidator.js";

router.post("/generate", [
  protect,
  isTeacher,
  validateQuizGeneration,
], generateQuizController);
```

**Example:**
```bash
# ✅ Valid
curl -X POST http://localhost:5001/api/quizzes/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "507f1f77bcf86cd799439011",
    "difficulty": "medium",
    "questionCount": 10
  }'

# ❌ Invalid difficulty level
curl -X POST http://localhost:5001/api/quizzes/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": "507f1f77bcf86cd799439011",
    "difficulty": "extreme",
    "questionCount": 10
  }'
# Returns 400: "Difficulty must be: easy, medium, or hard."
```

---

### 9. Enrollment Validation

**Validates:**
- Course ID format (MongoDB ObjectId)

**Usage:**
```javascript
import { validateEnrollmentCourseId } from "../middleware/securityValidator.js";

router.post("/enroll", [
  protect,
  body("courseId")
    .custom(validateObjectId)
    .withMessage("Invalid course ID format."),
  handleValidation,
], enrollCourseController);
```

**Example:**
```bash
# ✅ Valid
curl -X POST http://localhost:5001/api/enrollments/enroll \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId": "507f1f77bcf86cd799439011"}'

# ❌ Invalid course ID
curl -X POST http://localhost:5001/api/enrollments/enroll \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId": "not-a-valid-id"}'
# Returns 400: "Invalid course ID format."
```

---

## Complete Route Examples

### Authentication Routes

```javascript
import express from "express";
import {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
} from "../middleware/securityValidator.js";
import { register, login, resetPassword } from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", validateRegistration, register);

// POST /api/auth/login
router.post("/login", validateLogin, login);

// POST /api/auth/reset-password
router.post("/reset-password", validatePasswordReset, resetPassword);

export default router;
```

### Material Routes

```javascript
import express from "express";
import {
  validateMaterialUpload,
  validateCourseId,
  handleValidation,
} from "../middleware/securityValidator.js";
import { protect, isTeacher } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  uploadMaterial,
  getCourseMaterials,
  deleteMaterial,
} from "../controllers/materialController.js";

const router = express.Router();

// POST /api/materials/upload
router.post(
  "/upload",
  protect,
  isTeacher,
  upload.single("file"),
  validateMaterialUpload,
  uploadMaterial
);

// GET /api/materials/:courseId
router.get(
  "/:courseId",
  protect,
  validateCourseId,
  handleValidation,
  getCourseMaterials
);

// DELETE /api/materials/:id
router.delete(
  "/:id",
  protect,
  handleValidation,
  deleteMaterial
);

export default router;
```

### Chat Routes

```javascript
import express from "express";
import { validateChatRequest } from "../middleware/securityValidator.js";
import { protect } from "../middleware/authMiddleware.js";
import { askQuestion } from "../controllers/chatController.js";

const router = express.Router();

// POST /api/chat
router.post("/", protect, validateChatRequest, askQuestion);

export default router;
```

### Quiz Routes

```javascript
import express from "express";
import {
  validateQuizGeneration,
  validateQuizId,
  handleValidation,
} from "../middleware/securityValidator.js";
import { protect, isTeacher } from "../middleware/authMiddleware.js";
import {
  generateQuiz,
  getQuizById,
  deleteQuiz,
} from "../controllers/quizController.js";

const router = express.Router();

// POST /api/quizzes/generate
router.post(
  "/generate",
  protect,
  isTeacher,
  validateQuizGeneration,
  generateQuiz
);

// GET /api/quizzes/:quizId
router.get(
  "/:quizId",
  protect,
  validateQuizId,
  handleValidation,
  getQuizById
);

// DELETE /api/quizzes/:quizId
router.delete(
  "/:quizId",
  protect,
  isTeacher,
  validateQuizId,
  handleValidation,
  deleteQuiz
);

export default router;
```

### Course Routes

```javascript
import express from "express";
import { validateCourseCreation } from "../middleware/securityValidator.js";
import { protect, isTeacher } from "../middleware/authMiddleware.js";
import { createCourse, getCourses } from "../controllers/courseController.js";

const router = express.Router();

// POST /api/courses
router.post("/", protect, isTeacher, validateCourseCreation, createCourse);

// GET /api/courses
router.get("/", protect, getCourses);

export default router;
```

---

## Validation Error Responses

### Format

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address.",
      "value": "[REDACTED]"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter."
    }
  ]
}
```

### Common Error Codes

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid email format | Email doesn't match RFC 5322 |
| 400 | Password too short | Less than 8 characters |
| 400 | Password missing uppercase | No capital letters |
| 400 | Password missing number | No digits |
| 400 | Password missing special char | No !@#$%^&* |
| 400 | Passwords do not match | passwordConfirm !== password |
| 400 | Invalid ID format | Not a MongoDB ObjectId |
| 400 | Invalid file type | Not PDF/PPT/PPTX |
| 400 | File too large | > 50MB |
| 400 | Title too long | > 200 characters |
| 400 | Question too short | < 3 characters |

---

## Utility Functions

### sanitizeText(text, maxLength)

Removes HTML/script tags and escapes special characters.

```javascript
import { sanitizeText } from "../middleware/securityValidator.js";

const dangerous = "<script>alert('XSS')</script>Hello";
const safe = sanitizeText(dangerous);
// Output: "Hello"

const withSpecials = 'He said "Hello" & <welcome>';
const escaped = sanitizeText(withSpecials);
// Output: "He said &quot;Hello&quot; &amp; welcome"
```

### sanitizeFilename(filename)

Removes special characters from filenames.

```javascript
import { sanitizeFilename } from "../middleware/securityValidator.js";

const dangerous = "Important Document!@#$.pdf";
const safe = sanitizeFilename(dangerous);
// Output: "important-document.pdf"

const spaces = "My Important File.pdf";
const normalized = sanitizeFilename(spaces);
// Output: "my-important-file.pdf"
```

---

## Migration Path

### Before (No Validation)

```javascript
router.post("/login", loginController);
```

### After (With Validation)

```javascript
import { validateLogin } from "../middleware/securityValidator.js";

router.post("/login", validateLogin, loginController);
```

---

## Best Practices

1. **Always include `handleValidation`** as the last middleware in validation chain
2. **Use composite validators** when possible (e.g., `validateRegistration`)
3. **Passwords are sensitive** - validation errors don't include the value
4. **File uploads** - validate both MIME type AND size
5. **ObjectIds** - always validate in param routes
6. **XSS prevention** - use `validateTitle`, `validateDescription`, `validateQuestion`
7. **Order matters** - put validators BEFORE controllers
8. **Test validation** - curl examples provided above

---

## Troubleshooting

### "handleValidation is not a middleware"

Make sure you import it:
```javascript
import { handleValidation } from "../middleware/securityValidator.js";
```

### Validation not running

Check middleware order:
```javascript
// ✅ Correct
router.post("/", validateEmail, handleValidation, controller);

// ❌ Wrong - handleValidation must come after validators
router.post("/", handleValidation, validateEmail, controller);
```

### File validation not working

Ensure multer is set up BEFORE securityValidator:
```javascript
// ✅ Correct
router.post("/", upload.single("file"), validateMaterialUpload, controller);

// ❌ Wrong - multer must come first
router.post("/", validateMaterialUpload, upload.single("file"), controller);
```

---

## Dependencies

- `express-validator` - Input validation library
- `mongoose` - MongoDB ObjectId validation

All dependencies are already installed in package.json.
