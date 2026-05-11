import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');

// Test available models
const genAI = new GoogleGenerativeAI(apiKey);

console.log('\nTesting gemini-1.5-flash...');
try {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent('Say "hello"');
  const response = await result.response;
  console.log('✅ gemini-1.5-flash works:', response.text());
} catch (error) {
  console.log('❌ gemini-1.5-flash failed:', error.message);
}

console.log('\nTesting gemini-1.5-pro...');
try {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent('Say "hello"');
  const response = await result.response;
  console.log('✅ gemini-1.5-pro works:', response.text());
} catch (error) {
  console.log('❌ gemini-1.5-pro failed:', error.message);
}

console.log('\nTesting gemini-pro...');
try {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent('Say "hello"');
  const response = await result.response;
  console.log('✅ gemini-pro works:', response.text());
} catch (error) {
  console.log('❌ gemini-pro failed:', error.message);
}
