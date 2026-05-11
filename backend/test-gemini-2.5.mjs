import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing gemini-2.5-flash model...\n');

try {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const result = await model.generateContent('Say hello and confirm you are working!');
  const response = await result.response;
  
  console.log('✅ Model Response:', response.text());
  console.log('\n✅ SUCCESS: gemini-2.5-flash is working correctly!');
} catch (error) {
  console.error('❌ FAILED:', error.message);
}
