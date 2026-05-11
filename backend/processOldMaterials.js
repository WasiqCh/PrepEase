import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CourseMaterial from './models/CourseMaterial.js';
import { extractText, chunkText } from './utils/textExtractor.js';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function processOldMaterials() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all PDF materials that haven't been processed for Study Buddy
    const materials = await CourseMaterial.find({
      fileType: 'PDF',
      $or: [
        { aiStatus: { $ne: 'processed' } },
        { aiStatus: { $exists: false } }
      ]
    });

    console.log(`📚 Found ${materials.length} materials to process\n`);

    if (materials.length === 0) {
      console.log('✅ No materials need processing!');
      process.exit(0);
    }

    for (const material of materials) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 Processing: ${material.title || material.fileName}`);
      console.log(`ID: ${material._id}`);
      console.log(`File: ${material.filePath}`);

      // Check if file exists
      if (!fs.existsSync(material.filePath)) {
        console.log(`❌ File not found, skipping...`);
        continue;
      }

      try {
        // Step 1: Extract text
        console.log('📖 Extracting text...');
        const extractedText = await extractText(material.filePath);
        
        if (!extractedText || extractedText.trim().length === 0) {
          console.log('❌ No text content extracted, skipping...');
          continue;
        }

        console.log(`✅ Extracted ${extractedText.length} characters`);

        // Step 2: Create chunks
        console.log('✂️  Creating chunks...');
        const chunks = chunkText(extractedText, 600, 100);
        console.log(`✅ Created ${chunks.length} chunks`);

        // Step 3: Send to AI service
        console.log('🤖 Sending to AI service...');
        const response = await axios.post(`${AI_SERVICE_URL}/embed`, {
          lectureId: material._id.toString(),
          chunks
        }, {
          timeout: 120000
        });

        console.log(`✅ AI service processed successfully`);
        console.log(`   Embedding dimension: ${response.data.embedding_dim}`);

        // Step 4: Update material status
        material.aiStatus = 'processed';
        await material.save();

        console.log(`✅ Material marked as processed`);

      } catch (error) {
        console.error(`❌ Error processing material:`, error.message);
        
        material.aiStatus = 'failed';
        await material.save();
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Processing complete!');
    console.log('\nCheck AI service:');
    console.log('  curl http://localhost:8000/health');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

processOldMaterials();
