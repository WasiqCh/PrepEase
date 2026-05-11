import CourseMaterial from '../models/CourseMaterial.js';
import {
  studyBuddyChat,
  generateQuiz,
  generateAssignment,
  generateFlashcards,
  suggestResources
} from '../services/geminiService.js';

/**
 * Chat with Study Buddy AI
 * POST /api/study-buddy/chat
 */
async function chat(req, res) {
  try {
    const { materialId, question } = req.body;

    if (!materialId || !question) {
      return res.status(400).json({ message: 'materialId and question are required' });
    }

    // Get material with extracted text
    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (!material.extractedText) {
      return res.status(400).json({ 
        message: 'Material has no extracted text. Please upload a valid PDF/DOC file.' 
      });
    }

    console.log(`[Study Buddy] Chat request for material ${materialId}`);

    // Get AI response from Gemini
    const answer = await studyBuddyChat(material.extractedText, question);

    res.json({ answer });
  } catch (error) {
    console.error('[Study Buddy] Chat error:', error);
    res.status(500).json({ 
      message: 'Failed to get AI response', 
      error: error.message 
    });
  }
}

/**
 * Generate quiz from material
 * POST /api/study-buddy/generate-quiz
 */
async function createQuiz(req, res) {
  try {
    const { materialId, difficulty = 'medium', questionCount = 5 } = req.body;

    if (!materialId) {
      return res.status(400).json({ message: 'materialId is required' });
    }

    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (!material.extractedText) {
      return res.status(400).json({ message: 'Material has no extracted text' });
    }

    console.log(`[Study Buddy] Generating quiz for material ${materialId}`);

    const quiz = await generateQuiz(material.extractedText, difficulty, questionCount);

    res.json({
      materialId,
      materialTitle: material.title,
      difficulty,
      ...quiz
    });
  } catch (error) {
    console.error('[Study Buddy] Quiz generation error:', error);
    res.status(500).json({ message: 'Failed to generate quiz', error: error.message });
  }
}

/**
 * Generate assignment from material
 * POST /api/study-buddy/generate-assignment
 */
async function createAssignment(req, res) {
  try {
    const { materialId, assignmentType = 'essay', difficulty = 'medium' } = req.body;

    if (!materialId) {
      return res.status(400).json({ message: 'materialId is required' });
    }

    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (!material.extractedText) {
      return res.status(400).json({ message: 'Material has no extracted text' });
    }

    console.log(`[Study Buddy] Generating assignment for material ${materialId}`);

    const assignment = await generateAssignment(material.extractedText, assignmentType, difficulty);

    res.json({
      materialId,
      materialTitle: material.title,
      ...assignment
    });
  } catch (error) {
    console.error('[Study Buddy] Assignment generation error:', error);
    res.status(500).json({ message: 'Failed to generate assignment', error: error.message });
  }
}

/**
 * Generate flashcards from material
 * POST /api/study-buddy/generate-flashcards
 */
async function createFlashcards(req, res) {
  try {
    const { materialId, count = 10 } = req.body;

    if (!materialId) {
      return res.status(400).json({ message: 'materialId is required' });
    }

    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (!material.extractedText) {
      return res.status(400).json({ message: 'Material has no extracted text' });
    }

    console.log(`[Study Buddy] Generating ${count} flashcards for material ${materialId}`);

    const result = await generateFlashcards(material.extractedText, count);

    res.json({
      materialId,
      materialTitle: material.title,
      ...result
    });
  } catch (error) {
    console.error('[Study Buddy] Flashcard generation error:', error);
    res.status(500).json({ message: 'Failed to generate flashcards', error: error.message });
  }
}

/**
 * Suggest learning resources
 * POST /api/study-buddy/suggest-resources
 */
async function getResourceSuggestions(req, res) {
  try {
    const { materialId, topic } = req.body;

    if (!materialId || !topic) {
      return res.status(400).json({ message: 'materialId and topic are required' });
    }

    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (!material.extractedText) {
      return res.status(400).json({ message: 'Material has no extracted text' });
    }

    console.log(`[Study Buddy] Suggesting resources for topic: ${topic}`);

    const result = await suggestResources(material.extractedText, topic);

    res.json({
      materialId,
      materialTitle: material.title,
      topic,
      ...result
    });
  } catch (error) {
    console.error('[Study Buddy] Resource suggestion error:', error);
    res.status(500).json({ message: 'Failed to suggest resources', error: error.message });
  }
}

export {
  chat,
  createQuiz,
  createAssignment,
  createFlashcards,
  getResourceSuggestions
};
