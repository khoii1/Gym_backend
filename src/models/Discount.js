import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
      trim: true,
    },
    percent: { type: Number, required: true, min: 0, max: 100 },
    start_date: { type: Date, required: true },
    end_date: { type: Date },
  },
  { timestamps: true }
);

DiscountSchema.pre("validate", function (next) {
  if (this.end_date && this.start_date && this.end_date < this.start_date) {
    return next(new Error("end_date phải >= start_date"));
  }
  next();
});

export default mongoose.model("Discount", DiscountSchema);
