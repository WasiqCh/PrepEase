import mongoose from "mongoose";

const courseMaterialSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["PDF", "PPT"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Ready", "Failed"],
      default: "Pending",
    },
    extractedText: {
      type: String,
      default: "",
    },
    materialType: {
      type: String,
      enum: ["lecture", "resource", "assignment"],
      default: "lecture",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const CourseMaterial = mongoose.model("CourseMaterial", courseMaterialSchema);

export default CourseMaterial;
