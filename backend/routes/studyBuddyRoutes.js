import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateGeminiApiKey } from '../middleware/validateApiKey.js';
import {
  chat,
  createQuiz,
  createAssignment,
  createFlashcards,
  getResourceSuggestions
} from '../controllers/studyBuddyController.js';

const router = express.Router();

// All routes require authentication and valid API key
router.use(protect);
router.use(validateGeminiApiKey);

/**
 * POST /api/study-buddy/chat
 * Chat with AI Study Buddy
 */
router.post('/chat', chat);

/**
 * POST /api/study-buddy/generate-quiz
 * Generate quiz from material
 */
router.post('/generate-quiz', createQuiz);

/**
 * POST /api/study-buddy/generate-assignment
 * Generate assignment from material
 */
router.post('/generate-assignment', createAssignment);

/**
 * POST /api/study-buddy/generate-flashcards
 * Generate flashcards from material
 */
router.post('/generate-flashcards', createFlashcards);

/**
 * POST /api/study-buddy/suggest-resources
 * Suggest learning resources
 */
router.post('/suggest-resources', getResourceSuggestions);

export default router;
