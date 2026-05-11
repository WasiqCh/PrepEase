/**
 * Middleware to validate Gemini API key is present before processing AI requests
 */
export const validateGeminiKey = (req, res, next) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    return res.status(500).json({
      success: false,
      message: 'AI service is not configured. Please contact administrator.',
      error: 'API_KEY_MISSING'
    });
  }
  
  next();
};
