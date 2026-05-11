import 'dotenv/config';
import { studyBuddyChat } from './services/geminiService.js';

const testContent = `
JavaScript Loops

A loop is a programming structure that repeats a sequence of instructions until a specific condition is met.

Types of Loops:
1. For Loop - repeats a block of code a specific number of times
2. While Loop - repeats while a condition is true
3. Do-While Loop - executes at least once, then repeats while condition is true

Example:
for (let i = 0; i < 5; i++) {
  console.log(i);
}
`;

async function testGemini() {
  console.log('Testing Gemini Integration...\n');
  console.log('API Key present:', !!process.env.GEMINI_API_KEY);
  console.log('API Key length:', process.env.GEMINI_API_KEY?.length);
  console.log('');
  
  try {
    const answer = await studyBuddyChat(testContent, 'What are the three types of loops in JavaScript?');
    console.log('✅ Success!');
    console.log('Answer:', answer);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testGemini();
