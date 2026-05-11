import express from "express";
import { askQuestion, sendMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateGeminiApiKey } from "../middleware/validateApiKey.js";

const router = express.Router();

// AI Study Buddy Chat Endpoint (with API key validation)
router.post("/", protect, validateGeminiApiKey, askQuestion);

// Legacy endpoint (backward compatibility)
router.post("/send", protect, validateGeminiApiKey, sendMessage);

export default router;
