import Flashcard from '../models/Flashcard.js';
import Material from '../models/Material.js';
import { generateFlashcards } from '../services/geminiService.js';

/**
 * Generate flashcards from material
 * POST /api/flashcards/generate
 */
export const generateFlashcardsFromMaterial = async (req, res) => {
  try {
    const { materialId, count = 10 } = req.body;
    const teacherId = req.user.id;

    console.log('[Flashcard] Generate request:', { materialId, count, teacherId });

    // Validate material exists and belongs to teacher's course
    const material = await Material.findById(materialId).populate('courseId');
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check if teacher owns this course
    if (material.courseId.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized: You do not own this course' });
    }

    // Check if material has content
    if (!material.extractedText || material.extractedText.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Material has no extractable content for flashcard generation.' 
      });
    }

    console.log('[Flashcard] Calling Gemini API...');

    // Generate flashcards using Gemini
    const result = await generateFlashcards(material.extractedText, count);

    console.log('[Flashcard] Generated:', result.flashcards.length, 'flashcards');

    // Save to database
    const flashcardSet = new Flashcard({
      materialId: material._id,
      courseId: material.courseId._id,
      teacherId,
      flashcards: result.flashcards,
      count: result.flashcards.length
    });

    await flashcardSet.save();

    res.json({
      success: true,
      flashcards: result.flashcards,
      count: result.flashcards.length,
      flashcardSetId: flashcardSet._id
    });

  } catch (error) {
    console.error('[Flashcard] Generation error:', error.message);
    res.status(500).json({ 
      message: 'Failed to generate flashcards',
      error: error.message 
    });
  }
};

/**
 * Get flashcards for a material
 * GET /api/flashcards/material/:materialId
 */
export const getFlashcardsByMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find material
    const material = await Material.findById(materialId).populate('courseId');
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Check authorization
    if (userRole === 'teacher') {
      if (material.courseId.teacher.toString() !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (userRole === 'student') {
      // TODO: Check if student is enrolled in course
      // For now, allow all students
    }

    // Get flashcards
    const flashcardSets = await Flashcard.find({ materialId })
      .sort({ createdAt: -1 })
      .populate('teacherId', 'name email');

    res.json({
      success: true,
      flashcardSets
    });

  } catch (error) {
    console.error('[Flashcard] Fetch error:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch flashcards',
      error: error.message 
    });
  }
};

/**
 * Get flashcards by course (for students)
 * GET /api/flashcards/course/:courseId
 */
export const getFlashcardsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // TODO: Check if student is enrolled in course
    // For now, allow all

    const flashcardSets = await Flashcard.find({ courseId })
      .sort({ createdAt: -1 })
      .populate('materialId', 'title fileName')
      .populate('teacherId', 'name email');

    res.json({
      success: true,
      flashcardSets
    });

  } catch (error) {
    console.error('[Flashcard] Fetch by course error:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch flashcards',
      error: error.message 
    });
  }
};

/**
 * Delete flashcard set
 * DELETE /api/flashcards/:id
 */
export const deleteFlashcardSet = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const flashcardSet = await Flashcard.findById(id);
    if (!flashcardSet) {
      return res.status(404).json({ message: 'Flashcard set not found' });
    }

    // Check if teacher owns this flashcard set
    if (flashcardSet.teacherId.toString() !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await flashcardSet.deleteOne();

    res.json({
      success: true,
      message: 'Flashcard set deleted successfully'
    });

  } catch (error) {
    console.error('[Flashcard] Delete error:', error.message);
    res.status(500).json({ 
      message: 'Failed to delete flashcard set',
      error: error.message 
    });
  }
};
