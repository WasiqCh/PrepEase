import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

console.log('Fetching list of available models...\n');

try {
  // List all available models
  const models = await genAI.listModels();
  
  console.log('Available models:');
  for await (const model of models) {
    console.log('---');
    console.log('Name:', model.name);
    console.log('Display Name:', model.displayName);
    console.log('Supported Methods:', model.supportedGenerationMethods);
  }
} catch (error) {
  console.error('Error listing models:', error.message);
}
