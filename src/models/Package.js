import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
      trim: true,
    },
    name: { type: String, required: true, maxlength: 150 },
    duration_days: { type: Number, required: true, min: 1 },
    max_sessions: { type: Number, min: 1 }, // có thể để trống
    discount_id: { type: mongoose.Schema.Types.ObjectId, ref: "Discount" }, // tối đa 1 discount
  },
  { timestamps: true }
);

export default mongoose.model("Package", PackageSchema);
