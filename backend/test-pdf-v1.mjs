import { extractPDFText } from './utils/aiService.js';
import fs from 'fs';

const files = fs.readdirSync('./uploads').filter(f => f.endsWith('.pdf'));
if (files.length > 0) {
  const testFile = `./uploads/${files[0]}`;
  console.log('Testing with:', testFile);
  extractPDFText(testFile)
    .then(text => {
      console.log('✓ Success! Extracted', text.length, 'characters');
      console.log('First 200 chars:', text.substring(0, 200));
    })
    .catch(err => console.error('✗ Error:', err.message));
} else {
  console.log('No PDF files found');
}
