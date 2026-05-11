/**
 * PrepEase AI Service Integration Example
 * 
 * Add this to your Node.js backend to integrate with the AI service
 */

const axios = require('axios');

// Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIServiceClient {
  
  /**
   * Ingest material content into AI service
   * Call this after PDF extraction
   */
  async ingestMaterial(materialId, extractedText) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/ingest`, {
        materialId,
        extractedText
      });
      
      console.log(`✓ Material ${materialId} ingested successfully`);
      return response.data;
      
    } catch (error) {
      console.error('Error ingesting material:', error.message);
      throw new Error('Failed to ingest material into AI service');
    }
  }

  /**
   * Ask a question about specific material
   * Used for Study Buddy feature
   */
  async askQuestion(materialId, question) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
        materialId,
        question
      });
      
      return response.data.answer;
      
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Material not found. Please upload the material first.');
      }
      console.error('Error asking question:', error.message);
      throw new Error('Failed to get answer from AI service');
    }
  }

  /**
   * Generate quiz from material
   * Used for Quiz Generation feature
   */
  async generateQuiz(materialId, difficulty = 'medium', questionCount = 5) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/generate-quiz`, {
        materialId,
        difficulty,
        questionCount
      });
      
      return response.data.questions;
      
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Material not found. Please upload the material first.');
      }
      console.error('Error generating quiz:', error.message);
      throw new Error('Failed to generate quiz from AI service');
    }
  }

  /**
   * Check if AI service is healthy
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('AI service health check failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const aiService = new AIServiceClient();
module.exports = aiService;

// ============================================================
// USAGE EXAMPLES
// ============================================================

/**
 * Example 1: Material Upload Flow
 * When user uploads a PDF
 */
async function handleMaterialUpload(req, res) {
  try {
    // 1. Extract text from PDF (your existing logic)
    const extractedText = await extractPDFText(req.file.path);
    
    // 2. Save to MongoDB (your existing logic)
    const material = await Material.create({
      title: req.body.title,
      filePath: req.file.path,
      uploadedBy: req.user._id
    });
    
    // 3. Ingest into AI service
    await aiService.ingestMaterial(material._id.toString(), extractedText);
    
    res.json({
      success: true,
      material: material,
      message: 'Material uploaded and processed successfully'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Example 2: Study Buddy Chat Endpoint
 * POST /api/materials/:materialId/chat
 */
async function handleStudyBuddyChat(req, res) {
  try {
    const { materialId } = req.params;
    const { question } = req.body;
    
    // Verify material exists in your database
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    // Get answer from AI service
    const answer = await aiService.askQuestion(materialId, question);
    
    // Optional: Save chat history to MongoDB
    await ChatHistory.create({
      materialId,
      userId: req.user._id,
      question,
      answer,
      timestamp: new Date()
    });
    
    res.json({ answer });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Example 3: Quiz Generation Endpoint
 * POST /api/materials/:materialId/generate-quiz
 */
async function handleQuizGeneration(req, res) {
  try {
    const { materialId } = req.params;
    const { difficulty = 'medium', questionCount = 5 } = req.body;
    
    // Verify material exists
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    // Generate quiz
    const questions = await aiService.generateQuiz(
      materialId,
      difficulty,
      questionCount
    );
    
    // Optional: Save quiz to MongoDB
    const quiz = await Quiz.create({
      materialId,
      createdBy: req.user._id,
      difficulty,
      questions
    });
    
    res.json({
      success: true,
      quizId: quiz._id,
      questions
    });
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Example 4: Health Check Middleware
 * Check AI service health on startup
 */
async function checkAIServiceHealth() {
  const isHealthy = await aiService.healthCheck();
  if (!isHealthy) {
    console.warn('⚠️  AI service is not responding. Some features may be unavailable.');
  } else {
    console.log('✓ AI service is healthy');
  }
}

// Add to your app startup
// checkAIServiceHealth();

/**
 * Example 5: Express Routes Setup
 */
/*
const express = require('express');
const router = express.Router();
const auth = require('./middleware/auth'); // Your auth middleware

// Material routes
router.post('/materials/upload', auth, handleMaterialUpload);
router.post('/materials/:materialId/chat', auth, handleStudyBuddyChat);
router.post('/materials/:materialId/generate-quiz', auth, handleQuizGeneration);

module.exports = router;
*/

/**
 * Example 6: Error Handling
 * Add this to your error handling middleware
 */
/*
app.use((err, req, res, next) => {
  if (err.message.includes('AI service')) {
    return res.status(503).json({
      error: 'AI service temporarily unavailable',
      message: err.message
    });
  }
  next(err);
});
*/
