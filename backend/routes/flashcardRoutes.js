import express from 'express';
import {
  generateFlashcardsFromMaterial,
  getFlashcardsByMaterial,
  getFlashcardsByCourse,
  deleteFlashcardSet
} from '../controllers/flashcardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { teacherOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Teacher routes - generate and manage flashcards
router.post('/generate', protect, teacherOnly, generateFlashcardsFromMaterial);
router.delete('/:id', protect, teacherOnly, deleteFlashcardSet);

// Shared routes - view flashcards
router.get('/material/:materialId', protect, getFlashcardsByMaterial);
router.get('/course/:courseId', protect, getFlashcardsByCourse);

export default router;
