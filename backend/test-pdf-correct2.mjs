import { createRequire } from 'module';
import fs from 'fs/promises';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

console.log('pdf exports:', Object.keys(pdf));

// Try reading a PDF
const files = await fs.readdir('./uploads');
const pdfFile = files.find(f => f.endsWith('.pdf'));

if (pdfFile) {
  const dataBuffer = await fs.readFile(`./uploads/${pdfFile}`);
  
  // Try different ways
  try {
    const parser = new pdf.PDFParse();
    console.log('Created parser instance');
    const result = await parser.parse(dataBuffer);
    console.log('Method 1 worked!', result.text.length);
  } catch (e1) {
    console.log('Method 1 failed:', e1.message);
    
    try {
      // Maybe it's a simple function call
      const result = await pdf(dataBuffer);
      console.log('Method 2 worked! Extracted', result.text.length, 'characters');
    } catch (e2) {
      console.log('Method 2 failed:', e2.message);
    }
  }
}
