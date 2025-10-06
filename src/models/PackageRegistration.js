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

    // Pricing fields
    original_price: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    final_price: { type: Number, required: true },

    // Payment & Status
    payment_method: {
      type: String,
      enum: ["cash", "card", "transfer", "online"],
      default: "cash",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "cancelled", "expired"],
      default: "active",
    },
    status_reason: { type: String },

    // Additional tracking
    registration_date: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
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
