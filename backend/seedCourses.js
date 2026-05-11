/**
 * Seed Courses Script
 * Populates the database with sample courses for testing
 * 
 * Usage: node seedCourses.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Course from "./models/Course.js";
import { flattenSpring2026Catalog } from "./config/spring2026Catalog.js";

dotenv.config();

const sampleCourses = flattenSpring2026Catalog();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/prepease";
    console.log(`[Seed] Connecting to MongoDB at ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    console.log("[Seed] ✅ Connected to MongoDB\n");

    await Course.collection.dropIndex("courseCode_1").catch(() => {});
    await Course.syncIndexes().catch(() => {});

    console.log("[Seed] Upserting Spring-2026 catalog...\n");
    const createdCourses = [];

    for (const courseData of sampleCourses) {
      const course = await Course.findOneAndUpdate(
        {
          department: courseData.department,
          programSemester: courseData.programSemester,
          courseCode: courseData.courseCode,
        },
        { $set: courseData },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      createdCourses.push(course);
    }

    // Log created courses with their IDs
    console.log("[Seed] ✅ Courses created successfully:\n");
    console.log("========================================");
    
    createdCourses.forEach((course, index) => {
      console.log(`\n${index + 1}. ${course.title}`);
      console.log(`   Code: ${course.courseCode}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Description: ${course.description}`);
    });

    console.log("\n========================================");
    console.log("\n[Seed] 📋 Course IDs for testing:\n");
    
    createdCourses.forEach((course) => {
      console.log(`${course.department} | ${course.courseCode}: ${course._id}`);
    });

    console.log("\n[Seed] ✨ Seeding complete!\n");
    console.log("[Seed] You can now use these course IDs in your material uploads.\n");

  } catch (error) {
    console.error("[Seed] ❌ Error seeding database:");
    console.error(error.message);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("[Seed] 🔌 Disconnected from MongoDB\n");
  }
};

// Run the seeding script
seedDatabase();
