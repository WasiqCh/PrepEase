import { extractText } from './utils/textExtractor.js';

const testFile = './uploads/1769953432789-FYP.pdf';

console.log('Testing extractText...');
try {
  const text = await extractText(testFile);
  console.log('✅ SUCCESS!');
  console.log('Extracted characters:', text.length);
  console.log('First 100 chars:', text.substring(0, 100));
} catch(e) {
  console.log('❌ Error:', e.message);
}
