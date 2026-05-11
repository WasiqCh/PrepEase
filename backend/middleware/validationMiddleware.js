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

export const validateRegister = [
  body("email").isEmail().withMessage("Please provide a valid email."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  handleValidation,
];

export const validateLogin = [
  body("email").notEmpty().withMessage("Email is required."),
  body("password").notEmpty().withMessage("Password is required."),
  handleValidation,
];
