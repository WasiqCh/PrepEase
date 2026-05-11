import { createRequire } from 'module';
import fs from 'fs/promises';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const testFile = './uploads/1769953432789-FYP.pdf';
const dataBuffer = await fs.readFile(testFile);

console.log('PDFParse type:', typeof PDFParse);
console.log('Trying to parse...');

try {
  const parser = new PDFParse();
  const data = await parser.parse(dataBuffer);
  console.log('✅ Method 1 Success!');
  console.log('Text length:', data.text?.length || 0);
} catch(e) {
  console.log('❌ Method 1 failed:', e.message);
  
  // Try calling directly
  try {
    const data2 = await PDFParse(dataBuffer);
    console.log('✅ Method 2 Success!');
    console.log('Text length:', data2.text?.length || 0);
  } catch(e2) {
    console.log('❌ Method 2 failed:', e2.message);
  }
}
