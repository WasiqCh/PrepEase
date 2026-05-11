import { extractPDFText } from './utils/aiService.js';
import { studyBuddyChat } from './services/geminiService.js';
import fs from 'fs';

console.log('🧪 Testing Full AI Study Buddy Flow\n');

// Step 1: Extract PDF text
const files = fs.readdirSync('./uploads').filter(f => f.endsWith('.pdf'));
if (files.length === 0) {
  console.log('❌ No PDF files found in uploads');
  process.exit(1);
}

const testFile = `./uploads/${files[0]}`;
console.log(`📄 Step 1: Extracting text from ${files[0]}...`);

try {
  const extractedText = await extractPDFText(testFile);
  console.log(`✅ Extracted ${extractedText.length} characters\n`);
  
  // Step 2: Test Gemini AI chat
  console.log('🤖 Step 2: Testing Gemini AI chat...');
  const testQuestion = "What is this document about?";
  console.log(`   Question: "${testQuestion}"`);
  
  const answer = await studyBuddyChat(extractedText, testQuestion);
  console.log(`✅ AI Response received (${answer.length} chars):\n`);
  console.log('---');
  console.log(answer);
  console.log('---\n');
  
  console.log('✅ All tests passed! System is ready.');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
