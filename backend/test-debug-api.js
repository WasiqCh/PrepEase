import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function debugApi() {
  try {
    console.log('\n=== Gemini API Debugging ===\n');
    console.log('1. API Key Status:');
    console.log('   Loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO');
    console.log('   Length:', process.env.GEMINI_API_KEY?.length || 0);
    console.log('   Prefix:', process.env.GEMINI_API_KEY?.substring(0, 15) + '...');
    
    console.log('\n2. Attempting API call...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('   Model initialized successfully');
    console.log('   Sending test prompt...');
    
    const result = await model.generateContent('Say hello.');
    const response = await result.response;
    const text = response.text();
    
    console.log('\n✓✓✓ SUCCESS! ✓✓✓');
    console.log('Response:', text);
    
  } catch (error) {
    console.log('\n✗✗✗ ERROR ✗✗✗');
    console.log('Full error:', error);
    console.log('\nError details:');
    console.log('- Message:', error.message);
    console.log('- Status:', error.status);
    console.log('- Status Text:', error.statusText);
    
    if (error.message?.includes('API key not valid')) {
      console.log('\n⚠️  The API key appears to be invalid.');
      console.log('   Please generate a new key at: https://makersuite.google.com/app/apikey');
    }
  }
}

debugApi();
