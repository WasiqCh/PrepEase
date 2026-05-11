import axios from "axios";
import fs from "fs/promises";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} - Extracted text
 */
export const extractPDFText = async (filePath) => {
  try {
    // Dynamic import to avoid pdf-parse initialization bug and skip its test harness
    // Import the internal module directly to prevent index.js from executing test code
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("[PDF] Extraction failed for:", filePath);
    console.error(error.stack || error);
    // Propagate original error message to caller for better diagnostics
    throw new Error(error.message || "Failed to extract text from PDF");
  }
};

/**
 * Send extracted text to AI microservice for ingestion
 * @param {string} materialId - MongoDB material ID
 * @param {string} extractedText - Extracted text content
 * @returns {Promise<Object>} - AI service response
 */
export const ingestMaterialToAI = async (materialId, extractedText) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/ingest`,
      {
        materialId: materialId.toString(),
        extractedText,
      },
      {
        timeout: 30000, // 30 second timeout
      }
    );

    console.log(`[AI] Material ${materialId} ingested successfully`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("[AI] Ingestion failed:", error.message);
    
    if (error.code === "ECONNREFUSED") {
      throw new Error("AI service unavailable");
    }
    
    throw new Error(error.response?.data?.detail || "AI ingestion failed");
  }
};

/**
 * Check if AI service is healthy
 * @returns {Promise<boolean>}
 */
export const checkAIServiceHealth = async () => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return response.data.status === "healthy";
  } catch (error) {
    console.error("[AI] Health check failed:", error.message);
    return false;
  }
};
