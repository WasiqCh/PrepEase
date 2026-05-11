import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Check package.json main entry
const packageJson = require('pdf-parse/package.json');
console.log('Main entry:', packageJson.main);

// Now try the correct import
const pdfParse = require('pdf-parse');
console.log('Type of default require:', typeof pdfParse);

// Check if there's a default export
if (pdfParse.default) {
  console.log('Has default:', typeof pdfParse.default);
}

// Try to find the parse function
for (const key of Object.keys(pdfParse)) {
  console.log(`${key}:`, typeof pdfParse[key]);
}
