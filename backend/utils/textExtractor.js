import fs from 'fs/promises';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import path from 'path';

const require = createRequire(import.meta.url);

/**
 * Extract text from PDF, PPT, or DOC files
 */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (ext === '.pdf') {
      return await extractFromPDF(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      return await extractFromWord(filePath);
    } else if (ext === '.pptx' || ext === '.ppt') {
      // For PPT, would need additional library
      // For now, return error or handle separately
      throw new Error('PPT extraction requires additional setup. Please convert to PDF or use DOCX.');
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

async function extractFromPDF(filePath) {
  const { PDFParse } = require('pdf-parse');
  const dataBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  return result.text;
}

async function extractFromWord(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

/**
 * Split text into chunks of approximately 500-800 tokens
 * Simple word-based splitting (1 token ≈ 0.75 words)
 */
function chunkText(text, chunkSize = 600, overlap = 100) {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Clean and normalize text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
  
  // Split into words
  const words = cleanText.split(/\s+/);
  
  if (words.length <= chunkSize) {
    return [cleanText];
  }
  
  const chunks = [];
  let startIdx = 0;
  
  while (startIdx < words.length) {
    const endIdx = Math.min(startIdx + chunkSize, words.length);
    const chunk = words.slice(startIdx, endIdx).join(' ');
    
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
    
    // Move forward with overlap
    startIdx += chunkSize - overlap;
    
    // Break if we've covered all words
    if (endIdx >= words.length) {
      break;
    }
  }
  
  return chunks;
}

export {
  extractText,
  chunkText
};
