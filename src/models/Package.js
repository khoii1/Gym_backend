import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 150,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      comment: "Duration in days",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      comment: "Price in VND",
    },
    features: [
      {
        type: String,
        maxlength: 100,
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
    },
    maxSessions: {
      type: Number,
      min: 1,
      comment: "Maximum number of sessions allowed (optional)",
    },
  },
  { timestamps: true }
);

// Indexes for better performance
PackageSchema.index({ name: 1 });
PackageSchema.index({ status: 1 });
PackageSchema.index({ price: 1 });

export default mongoose.model("Package", PackageSchema);
