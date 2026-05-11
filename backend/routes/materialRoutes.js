import express from "express";
import { getCourseMaterials, getAllMaterials, getMaterialById, upload, uploadMaterial, deleteMaterial, updateMaterial } from "../controllers/materialController.js";
import { protect, isTeacher } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", protect, isTeacher, upload.single("file"), uploadMaterial);
router.put("/:id", protect, isTeacher, upload.single("file"), updateMaterial);
router.delete("/:id", protect, isTeacher, deleteMaterial);
router.get("/", protect, getAllMaterials);
router.get("/material/:id", protect, getMaterialById);
router.get("/:courseId", protect, getCourseMaterials);

export default router;
