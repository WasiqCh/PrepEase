// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

// Now import everything else
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import studyBuddyRoutes from "./routes/studyBuddyRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import apiLimiter from "./middleware/rateLimit.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { flattenSpring2026Catalog } from "./config/spring2026Catalog.js";
import Course from "./models/Course.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS must be first - before any routes or other middleware
console.log("[Server] Setting up CORS for localhost:3000 and localhost:3001...");
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  optionsSuccessStatus: 200
}));

console.log("[Server] Initializing middleware...");
app.use(express.json());
app.use(apiLimiter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route to verify server is reachable
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/", (_req, res) => {
  res.status(200).json({ message: "PrepEase API is running." });
});

console.log("[Server] Mounting /api/auth routes...");
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/study-buddy", studyBuddyRoutes);
app.use("/api/flashcards", flashcardRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();

  await Course.collection.dropIndex("courseCode_1").catch(() => {});
  await Course.syncIndexes().catch(() => {});
  const catalogCourses = flattenSpring2026Catalog();
  for (const courseData of catalogCourses) {
    await Course.findOneAndUpdate(
      {
        department: courseData.department,
        programSemester: courseData.programSemester,
        courseCode: courseData.courseCode,
      },
      { $set: courseData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
