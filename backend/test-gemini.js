import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

console.log('Testing Gemini API Connection...\n');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✓ API Key found:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));

const genAI = new GoogleGenerativeAI(apiKey);

async function testConnection() {
  try {
    console.log('\nTesting API with simple prompt...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Say "Hello PrepEase!"');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ SUCCESS! Gemini API is working!');
    console.log('\nResponse:', text);
    console.log('\n✅ You can now use all AI features in PrepEase!');
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    
    if (error.message.includes('API key not valid')) {
      console.log('\n🔑 ACTION REQUIRED:');
      console.log('   1. Go to: https://aistudio.google.com/app/apikey');
      console.log('   2. Create a new API key');
      console.log('   3. Update .env file with: GEMINI_API_KEY=your-new-key');
      console.log('   4. Restart the backend server');
    }
  }
}

testConnection();
