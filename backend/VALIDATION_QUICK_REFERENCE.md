# Security Validation - Quick Reference

## File Structure
```
middleware/
├── securityValidator.js    ← New comprehensive validation middleware
├── validationMiddleware.js ← Existing (can be deprecated)
├── validator.js            ← Existing (can be deprecated)
└── uploadMiddleware.js     ← Existing (works with validation)
```

## Import Statement
```javascript
import { 
  validateEmail,
  validatePasswordStrength,
  validatePasswordMatch,
  validateObjectId,
  validateTitle,
  validateDescription,
  validateQuestion,
  validateCourseCode,
  validateCourseName,
  validateMaterialUpload,
  validateChatRequest,
  validateQuizGeneration,
  validateCourseCreation,
  validateLogin,
  validateRegistration,
  handleValidation
} from "../middleware/securityValidator.js";
```

---

## Quick Patterns

### Pattern 1: Single Field Validation
```javascript
router.post("/", [
  validateEmail,
  handleValidation,
], controller);
```

### Pattern 2: Multiple Field Validation
```javascript
router.post("/", [
  validateEmail,
  validatePasswordStrength,
  validatePasswordMatch,
  handleValidation,
], controller);
```

### Pattern 3: Use Composite Validator
```javascript
// This does all the above automatically
router.post("/", validateRegistration, controller);
```

### Pattern 4: Parameter Validation
```javascript
router.get("/:courseId", [
  protect,
  validateCourseId,
  handleValidation,
], controller);
```

### Pattern 5: File Upload Validation
```javascript
router.post("/", [
  protect,
  isTeacher,
  upload.single("file"),
  validateMaterialUpload,
], controller);
```

---

## Available Validators at a Glance

### Email & Auth
- `validateEmail` - RFC 5322 email
- `validatePasswordStrength` - 8+ chars, upper, lower, number, special
- `validatePasswordMatch` - passwordConfirm === password
- `validateLogin` - Email + password required
- `validateRegistration` - Email + name + password strength + match

### ObjectIds
- `validateObjectId` - Function to validate ID format
- `validateCourseId` - For :courseId param
- `validateMaterialId` - For :materialId param
- `validateQuizId` - For :quizId param
- `validateUserId` - For :userId param

### Text Content
- `validateTitle` - 1-200 chars, XSS protected
- `validateDescription` - 0-5000 chars, XSS protected
- `validateQuestion` - 3-2000 chars, XSS protected

### Files
- `validateMaterialUpload` - Course ID + title + file (MIME + size)
- `validateFileMimeType` - PDF, PPT, PPTX only
- `validateFileSize` - Max 50MB

### Courses
- `validateCourseCode` - 2-10 chars, alphanumeric, uppercase
- `validateCourseName` - 1-200 chars, XSS protected
- `validateCourseCreation` - All course fields

### Specific Operations
- `validateChatRequest` - Material ID + question
- `validateQuizGeneration` - Material ID + difficulty + count
- `validateEnrollmentCourseId` - Valid course ID

---

## Validation Rules Summary

| Field | Min | Max | Format | Special |
|-------|-----|-----|--------|---------|
| Email | - | - | RFC 5322 | lowercase |
| Password | 8 | - | A-Z,a-z,0-9,!@#$%^&* | required all types |
| Title | 1 | 200 | Text | XSS safe |
| Description | 0 | 5000 | Text | XSS safe |
| Question | 3 | 2000 | Text | XSS safe |
| Course Code | 2 | 10 | A-Z,0-9 | uppercase |
| File Size | - | 50MB | PDF/PPT/PPTX | checked |
| ObjectId | - | - | MongoDB | 24 hex chars |
| Difficulty | - | - | easy/medium/hard | enum |
| Question Count | 1 | 20 | integer | range |
| Page | 1 | 1000 | integer | pagination |
| Limit | 1 | 100 | integer | pagination |

---

## Response Format

### Success (No Validation Errors)
- Request passes through to controller
- `validationResult(req).isEmpty() === true`

### Failure (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address.",
      "value": "[REDACTED]"
    }
  ]
}
```

---

## Security Features

✅ **XSS Prevention** - HTML/script tags removed, special chars escaped  
✅ **Injection Prevention** - MongoDB ObjectId validation  
✅ **File Type Checking** - Only PDF/PPT/PPTX allowed  
✅ **File Size Limits** - Max 50MB  
✅ **Filename Sanitization** - Special chars removed  
✅ **Email Validation** - RFC 5322 compliant  
✅ **Password Strength** - Enforced minimum requirements  
✅ **Malformed Request Prevention** - Type checking, length limits  
✅ **Sensitive Data Redaction** - Password values not in error messages  

---

## Error Response Codes

| Code | Scenario |
|------|----------|
| 400 | Invalid email format |
| 400 | Weak password (length/chars) |
| 400 | Passwords don't match |
| 400 | Invalid ObjectId format |
| 400 | Wrong file type |
| 400 | File too large |
| 400 | Title too long/short |
| 400 | Question too short |
| 400 | Invalid course code |
| 400 | Missing required field |

---

## Real-World Examples

### Register Route (With All Validations)
```javascript
router.post("/register", validateRegistration, registerController);

// Validates:
// - Valid email format
// - Name 2-100 chars
// - Password 8+ chars with uppercase, lowercase, number, special
// - passwordConfirm matches password
```

### Upload Material (With File Validation)
```javascript
router.post("/upload", [
  protect,
  isTeacher,
  upload.single("file"),
  validateMaterialUpload,
], uploadController);

// Validates:
// - Valid course ID
// - Title 1-200 chars
// - File is PDF/PPT/PPTX
// - File size < 50MB
```

### Get Materials (With ID Validation)
```javascript
router.get("/:courseId", [
  protect,
  validateCourseId,
  handleValidation,
], getMaterialsController);

// Validates:
// - courseId is valid MongoDB ObjectId
```

### Chat Request (With Content Validation)
```javascript
router.post("/", [
  protect,
  validateChatRequest,
], askQuestionController);

// Validates:
// - Valid material ID
// - Question 3-2000 chars
// - XSS protection on question
```

---

## Utility Functions

### sanitizeText(text, maxLength = 1000)
```javascript
import { sanitizeText } from "../middleware/securityValidator.js";

// Removes HTML tags
sanitizeText("<script>alert('xss')</script>Hello") 
// → "Hello"

// Escapes special chars
sanitizeText("He said \"Hello\" & <welcome>") 
// → "He said &quot;Hello&quot; &amp; welcome"

// Limits length
sanitizeText("Very long text...", 50) 
// → "Very long text..." (truncated to 50 chars)
```

### sanitizeFilename(filename)
```javascript
import { sanitizeFilename } from "../middleware/securityValidator.js";

// Removes special chars
sanitizeFilename("Document!@#$%^&.pdf") 
// → "document.pdf"

// Replaces spaces
sanitizeFilename("My Important File.pdf") 
// → "my-important-file.pdf"

// Limits length to 255 chars
sanitizeFilename("VeryLongFileName..." + "x".repeat(300)) 
// → Truncated to 255 chars
```

---

## Testing Validation

### Test Email Validation
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid", "password": "Test123!", "name": "Test", "passwordConfirm": "Test123!"}'
# Returns 400: "Please provide a valid email address."
```

### Test Password Strength
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@test.com", "password": "weak", "name": "Test", "passwordConfirm": "weak"}'
# Returns 400: Multiple password errors
```

### Test ObjectId Validation
```bash
curl -X GET http://localhost:5001/api/materials/invalid-id \
  -H "Authorization: Bearer TOKEN"
# Returns 400: "Invalid material ID format."
```

### Test File Upload
```bash
curl -X POST http://localhost:5001/api/materials/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "courseId=invalid" \
  -F "title=Test" \
  -F "file=@doc.docx"
# Returns 400: Multiple errors (invalid ID, wrong file type)
```

---

## Next Steps

1. **Review** - Read `VALIDATION_GUIDE.md` for detailed docs
2. **Test** - Run cURL examples above to test validation
3. **Integrate** - Add validators to routes (examples provided)
4. **Deploy** - No DB changes needed, purely middleware

---

## Support

All validators are pre-built and ready to use. No controller changes needed - purely middleware-based approach as requested.
