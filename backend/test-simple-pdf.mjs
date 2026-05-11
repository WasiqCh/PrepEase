// Try using it as the README suggests
import { createRequire } from 'module';
import fs from 'fs/promises';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const files = await fs.readdir('./uploads');
const pdfFile = files.find(f => f.endsWith('.pdf'));

if (pdfFile) {
  const dataBuffer = await fs.readFile(`./uploads/${pdfFile}`);
  
  // Initialize parser
  const parser = new pdf.PDFParse();
  const result = await parser.parseBuffer(dataBuffer);
  console.log('Success!', result.text.substring(0, 200));
}
