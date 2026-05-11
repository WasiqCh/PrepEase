import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Loaded (' + process.env.GEMINI_API_KEY.length + ' chars)' : 'NOT LOADED');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('Sending test prompt...');
    const result = await model.generateContent('Say hello in one sentence.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✓ SUCCESS!');
    console.log('Response:', text);
    
  } catch (error) {
    console.error('✗ ERROR:', error.message);
    if (error.message.includes('API key not valid')) {
      console.error('The API key is invalid or expired.');
    } else if (error.status === 404) {
      console.error('Model not found. The model name may be incorrect.');
    }
  }
}

testGemini();
