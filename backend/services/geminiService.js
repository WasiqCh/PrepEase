import { GoogleGenerativeAI } from '@google/generative-ai';

const PREP_EASE_SYSTEM_INSTRUCTION = 
  'You are the Prep-Ease Study Assistant. Use only the provided document text to answer user questions. ' +
  'If the answer isn\'t in the text, say you don\'t know. Never use external knowledge.';

// Use Gemini 2.5 Flash (latest stable model as of March 2026)
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Lazy initialization - creates client at execution time with current env vars
 */
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    console.error('[Gemini] API_KEY_INVALID: GEMINI_API_KEY is missing or empty');
    throw new Error('API_KEY_INVALID: GEMINI_API_KEY not configured');
  }
  
  console.log('[Gemini] Initializing with API key:', apiKey.substring(0, 8) + '...');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Return model without systemInstruction (include it in prompts instead)
  return genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  });
}

/**
 * Study Buddy Chat - Answer questions based on PDF content
 */
export async function studyBuddyChat(materialContent, question) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('API_KEY_INVALID: GEMINI_API_KEY not configured');
    }

    const model = getModel();
    
    const prompt = `${PREP_EASE_SYSTEM_INSTRUCTION}

You are a Study Buddy AI for an educational platform.

LECTURE CONTENT:
${materialContent}

STUDENT QUESTION:
${question}

INSTRUCTIONS:
- Answer the question using ONLY the provided lecture content above
- Be clear, concise, and educational
- If the answer is not in the lecture content, respond exactly: "The uploaded material does not cover this topic."
- Do not use external knowledge
- Format your answer in a student-friendly way

ANSWER:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    // Enhanced error handling
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid')) {
      console.error('[Gemini] API_KEY_INVALID: Invalid or missing API key');
      throw new Error('API_KEY_INVALID: Please check your Gemini API key configuration');
    } else if (error.message.includes('MODEL_NOT_FOUND') || error.status === 404) {
      console.error('[Gemini] MODEL_NOT_FOUND: The requested model is not available');
      throw new Error('MODEL_NOT_FOUND: The AI model is currently unavailable');
    } else if (error.message.includes('[400 Bad Request]')) {
      console.error('[Gemini] Bad Request:', error.message);
      throw new Error('API_KEY_INVALID: ' + error.message);
    }
    
    console.error('[Gemini] Unexpected error:', error.message);
    throw error;
  }
}

/**
 * Generate Quiz from PDF content
 */
export async function generateQuiz(materialContent, difficulty = 'medium', questionCount = 5) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('API_KEY_INVALID: GEMINI_API_KEY not configured');
    }

    const model = getModel();
    
    const prompt = `${PREP_EASE_SYSTEM_INSTRUCTION}

You are a quiz generator for an educational platform.

LECTURE CONTENT:
${materialContent}

TASK:
Generate a quiz with ${questionCount} questions based ONLY on the provided lecture content.

REQUIREMENTS:
- Difficulty level: ${difficulty}
- Include a mix of:
  * Multiple Choice Questions (4 options each)
  * True/False questions
- Questions must be derived from the lecture content
- Each question should test understanding, not just memorization
- Provide correct answers

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "type": "mcq",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation why this is correct"
    },
    {
      "type": "true_false",
      "question": "Statement here?",
      "correctAnswer": true,
      "explanation": "Brief explanation"
    }
  ]
}

Generate the quiz now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to generate quiz in correct format');
    
  } catch (error) {
    // Enhanced error handling
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid')) {
      console.error('[Gemini] API_KEY_INVALID: Invalid or missing API key');
      throw new Error('API_KEY_INVALID: Please check your Gemini API key configuration');
    } else if (error.message.includes('MODEL_NOT_FOUND') || error.status === 404) {
      console.error('[Gemini] MODEL_NOT_FOUND: The requested model is not available');
      throw new Error('MODEL_NOT_FOUND: The AI model is currently unavailable');
    } else if (error.message.includes('[400 Bad Request]')) {
      console.error('[Gemini] Bad Request:', error.message);
      throw new Error('API_KEY_INVALID: ' + error.message);
    }
    
    console.error('[Gemini] Unexpected error:', error.message);
    throw error;
  }
}

/**
 * Generate Assignment from PDF content
 */
export async function generateAssignment(materialContent, assignmentType = 'essay', difficulty = 'medium') {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('API_KEY_INVALID: GEMINI_API_KEY not configured');
    }

    const model = getModel();
    
    const prompt = `${PREP_EASE_SYSTEM_INSTRUCTION}

You are an assignment generator for an educational platform.

LECTURE CONTENT:
${materialContent}

TASK:
Generate a ${assignmentType} assignment based on the provided lecture content.

REQUIREMENTS:
- Difficulty level: ${difficulty}
- Assignment should test deep understanding
- Include clear instructions
- Provide evaluation criteria
- Suggested word count or time limit

OUTPUT FORMAT (JSON):
{
  "title": "Assignment title",
  "type": "${assignmentType}",
  "instructions": "Clear instructions for students",
  "questions": [
    "Question or task 1",
    "Question or task 2",
    "Question or task 3"
  ],
  "evaluationCriteria": [
    "Criterion 1",
    "Criterion 2",
    "Criterion 3"
  ],
  "suggestedWordCount": "500-1000 words",
  "estimatedTime": "2 hours"
}

Generate the assignment now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to generate assignment in correct format');
    
  } catch (error) {
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid')) {
      console.error('[Gemini] API_KEY_INVALID: Invalid or missing API key');
      throw new Error('API_KEY_INVALID: Please check your Gemini API key configuration');
    } else if (error.message.includes('MODEL_NOT_FOUND') || error.status === 404) {
      console.error('[Gemini] MODEL_NOT_FOUND: The requested model is not available');
      throw new Error('MODEL_NOT_FOUND: The AI model is currently unavailable');
    } else if (error.message.includes('[400 Bad Request]')) {
      console.error('[Gemini] Bad Request:', error.message);
      throw new Error('API_KEY_INVALID: ' + error.message);
    }
    
    console.error('[Gemini] Unexpected error:', error.message);
    throw error;
  }
}

/**
 * Generate Flashcards from PDF content
 */
export async function generateFlashcards(materialContent, count = 10) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('API_KEY_INVALID: GEMINI_API_KEY not configured');
    }

    const model = getModel();
    
    const prompt = `${PREP_EASE_SYSTEM_INSTRUCTION}

You are a flashcard generator for an educational platform.

LECTURE CONTENT:
${materialContent}

TASK:
Generate ${count} flashcards based on the key concepts in the lecture content.

REQUIREMENTS:
- Each flashcard should have a clear question/term on the front
- Concise, accurate answer on the back
- Cover the most important concepts
- Use simple language

OUTPUT FORMAT (JSON):
{
  "flashcards": [
    {
      "front": "Question or term here",
      "back": "Answer or definition here"
    }
  ]
}

Generate ${count} flashcards now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to generate flashcards in correct format');
    
  } catch (error) {
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid')) {
      console.error('[Gemini] API_KEY_INVALID: Invalid or missing API key');
      throw new Error('API_KEY_INVALID: Please check your Gemini API key configuration');
    } else if (error.message.includes('MODEL_NOT_FOUND') || error.status === 404) {
      console.error('[Gemini] MODEL_NOT_FOUND: The requested model is not available');
      throw new Error('MODEL_NOT_FOUND: The AI model is currently unavailable');
    } else if (error.message.includes('[400 Bad Request]')) {
      console.error('[Gemini] Bad Request:', error.message);
      throw new Error('API_KEY_INVALID: ' + error.message);
    }
    
    console.error('[Gemini] Unexpected error:', error.message);
    throw error;
  }
}

/**
 * Suggest learning resources based on PDF content
 */
export async function suggestResources(materialContent, topic) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('API_KEY_INVALID: GEMINI_API_KEY not configured');
    }

    const model = getModel();
    
    const prompt = `${PREP_EASE_SYSTEM_INSTRUCTION}

You are a learning resource advisor for an educational platform.

LECTURE CONTENT:
${materialContent}

STUDENT'S TOPIC OF INTEREST:
${topic}

TASK:
Based on the lecture content, suggest additional learning resources for the student to explore this topic further.

REQUIREMENTS:
- Suggest 5-7 resources
- Include mix of: videos, articles, books, practice exercises
- Keep suggestions relevant to the lecture level
- Provide brief description for each resource

OUTPUT FORMAT (JSON):
{
  "resources": [
    {
      "type": "video",
      "title": "Resource title",
      "description": "Why this helps",
      "suggestedSource": "YouTube/Khan Academy/etc"
    },
    {
      "type": "article",
      "title": "Article title",
      "description": "Why this helps",
      "suggestedSource": "Website name"
    }
  ]
}

Generate resource suggestions now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to generate resources in correct format');
    
  } catch (error) {
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid')) {
      console.error('[Gemini] API_KEY_INVALID: Invalid or missing API key');
      throw new Error('API_KEY_INVALID: Please check your Gemini API key configuration');
    } else if (error.message.includes('MODEL_NOT_FOUND') || error.status === 404) {
      console.error('[Gemini] MODEL_NOT_FOUND: The requested model is not available');
      throw new Error('MODEL_NOT_FOUND: The AI model is currently unavailable');
    } else if (error.message.includes('[400 Bad Request]')) {
      console.error('[Gemini] Bad Request:', error.message);
      throw new Error('API_KEY_INVALID: ' + error.message);
    }
    
    console.error('[Gemini] Unexpected error:', error.message);
    throw error;
  }
}
