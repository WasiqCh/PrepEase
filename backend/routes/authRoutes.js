import express from "express";
import { login } from "../controllers/authController.js";
import { loginRules } from "../middleware/validator.js";

const router = express.Router();

router.post("/login", loginRules, login);

export default router;
