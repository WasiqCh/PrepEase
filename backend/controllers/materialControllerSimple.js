import Material from "../models/Material.js";
import fs from "fs";
import path from "path";

// @desc    Upload material (Teacher only)
// @route   POST /api/materials
// @access  Private (Teacher)
export const uploadMaterial = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can upload materials" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const material = await Material.create({
      title,
      fileUrl,
      uploadedBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Material uploaded successfully",
      material,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Upload failed" });
  }
};

// @desc    Get all materials
// @route   GET /api/materials
// @access  Private (Teacher + Student)
export const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find()
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: materials.length,
      materials,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch materials" });
  }
};

// @desc    Delete material (Only uploader)
// @route   DELETE /api/materials/:id
// @access  Private
export const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Check if user is the uploader
    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own materials" });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), material.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Material.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to delete material" });
  }
};
