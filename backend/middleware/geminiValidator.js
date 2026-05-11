/**
 * Middleware to validate Gemini API key exists before AI routes
 */
export const validateGeminiApiKey = (req, res, next) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
    console.error('[Gemini Validator] API key missing or empty');
    return res.status(500).json({ 
      message: 'AI service is not properly configured. Please contact administrator.',
      error: 'API_KEY_MISSING'
    });
  }
  next();
};
