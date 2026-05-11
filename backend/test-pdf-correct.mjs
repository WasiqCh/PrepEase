import { createRequire } from 'module';
import fs from 'fs/promises';

const require = createRequire(import.meta.url);

try {
  const pdfModule = require('pdf-parse');
  
  console.log('Has default?', pdfModule.default);
  console.log('Has PDFParse?', typeof pdfModule.PDFParse);
  
  // Check package.json main export
  const pkg = require('pdf-parse/package.json');
  console.log('Main export:', pkg.main);
  
  // Try loading differently
  const pdf2 = require('pdf-parse/lib/pdf-parse.js');
  console.log('Direct import type:', typeof pdf2);
  
  const testFile = './uploads/1769953432789-FYP.pdf';
  const dataBuffer = await fs.readFile(testFile);
  
  console.log('\nTrying direct import...');
  const data = await pdf2(dataBuffer);
  console.log('✅ Success! Extracted:', data.text.substring(0, 100));
  
} catch(e) {
  console.log('❌ Error:', e.message);
}
