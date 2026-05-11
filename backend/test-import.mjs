import { createRequire } from 'module';
import { extractText } from './utils/textExtractor.js';

console.log('✅ textExtractor imported successfully');
console.log('extractText type:', typeof extractText);

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
console.log('✅ pdf-parse type:', typeof pdfParse);
