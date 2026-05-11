import express from "express";
import { uploadMaterial, getMaterials, deleteMaterial } from "../controllers/materialControllerSimple.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/materials - Upload material (Teacher only, checked in controller)
router.post("/", protect, upload.single("file"), uploadMaterial);

// GET /api/materials - Get all materials (Teacher + Student)
router.get("/", protect, getMaterials);

// DELETE /api/materials/:id - Delete material (Only uploader)
router.delete("/:id", protect, deleteMaterial);

export default router;
