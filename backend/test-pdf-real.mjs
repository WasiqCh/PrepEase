import { createRequire } from 'module';
import fs from 'fs/promises';

const require = createRequire(import.meta.url);

try {
  const pdfParse = require('pdf-parse');
  
  console.log('Type of pdfParse:', typeof pdfParse);
  console.log('pdfParse is:', pdfParse);
  
  // Try to use it
  const testFile = './uploads/1769953432789-FYP.pdf';
  const dataBuffer = await fs.readFile(testFile);
  
  console.log('\nTrying to parse...');
  const data = await pdfParse(dataBuffer);
  console.log('✅ Success! Extracted characters:', data.text.length);
  
} catch(e) {
  console.log('❌ Error:', e.message);
  console.log('Stack:', e.stack);
}
