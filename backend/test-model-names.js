import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try different model names
    const modelNames = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'models/gemini-1.5-flash',
      'models/gemini-pro'
    ];
    
    for (const modelName of modelNames) {
      try {
        console.log(`\nTrying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hi');
        const response = await result.response;
        console.log(`✓ SUCCESS with ${modelName}`);
        console.log('Response:', response.text().substring(0, 50) + '...');
        break;
      } catch (error) {
        console.log(`✗ Failed: ${error.message.substring(0, 100)}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listModels();
