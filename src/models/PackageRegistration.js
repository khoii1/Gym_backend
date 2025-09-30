import mongoose from "mongoose";

const PackageRegistrationSchema = new mongoose.Schema(
  {
    member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    discount_id: { type: mongoose.Schema.Types.ObjectId, ref: "Discount" },
    remaining_sessions: { type: Number, min: 0 },
  },
  { timestamps: true }
);

PackageRegistrationSchema.pre("validate", function (next) {
  if (this.end_date && this.start_date && this.end_date < this.start_date) {
    return next(new Error("end_date phải >= start_date"));
  }
  next();
});

export default mongoose.model("PackageRegistration", PackageRegistrationSchema);
