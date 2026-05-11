/**
 * Middleware to validate Gemini API key is configured
 */
export const validateGeminiApiKey = (req, res, next) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    console.error('[Middleware] GEMINI_API_KEY is not configured');
    return res.status(500).json({
      success: false,
      message: 'AI service is not properly configured. Please contact administrator.'
    });
  }
  
  // Key exists, proceed
  next();
};
