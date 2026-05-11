import { body, validationResult } from "express-validator";

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed.",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  return next();
};

export const createUserRules = [
  body("firstName").notEmpty().withMessage("First name is required."),
  body("lastName").notEmpty().withMessage("Last name is required."),
  body("email").isEmail().withMessage("Please provide a valid email."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("role").isIn(["Student", "Teacher"]).withMessage("Role must be 'Student' or 'Teacher'."),
  body("department").custom((value, { req }) => {
    if (req.body.role === "Student" && !value) {
      throw new Error("Department is required for students.");
    }
    return true;
  }),
  body("semester").custom((value, { req }) => {
    if (req.body.role === "Student" && !value) {
      throw new Error("Semester is required for students.");
    }
    return true;
  }),
  body("subjects").custom((value, { req }) => {
    if (req.body.role === "Student") {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("At least one subject is required for students.");
      }
    }
    return true;
  }),
  body("assignedDepartments").custom((value, { req }) => {
    if (req.body.role === "Teacher") {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("At least one assigned department is required for teachers.");
      }
    }
    return true;
  }),
  body("assignedSemesters").custom((value, { req }) => {
    if (req.body.role === "Teacher") {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("At least one assigned semester is required for teachers.");
      }
    }
    return true;
  }),
  body("assignedSubjects").custom((value, { req }) => {
    if (req.body.role === "Teacher") {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("At least one assigned subject is required for teachers.");
      }
    }
    return true;
  }),
  handleValidation,
];

export const loginRules = [
  body("email").notEmpty().withMessage("Email is required."),
  body("password").notEmpty().withMessage("Password is required."),
  handleValidation,
];
