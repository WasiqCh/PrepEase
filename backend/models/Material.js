import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Material = mongoose.model("Material", materialSchema);

export default Material;
