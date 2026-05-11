import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAPIKey() {
  console.log('API Key:', process.env.GEMINI_API_KEY);
  console.log('\nTesting different model names...\n');
  
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp'
  ];
  
  for (const modelName of modelsToTry) {
  try {
    console.log(`Testing: ${modelName}`);
    
    // ADD THE SECOND ARGUMENT HERE: { apiVersion: 'v1' }
    const model = genAI.getGenerativeModel(
      { model: modelName },
      { apiVersion: 'v1' } 
    );

    const result = await model.generateContent('Say hello');
    const response = await result.response;
    console.log(`✅ ${modelName} works!`);
    break; 
  } catch (error) {
    console.log(`❌ ${modelName} failed:`, error.message.substring(0, 100));
  }
}
}

testAPIKey();
