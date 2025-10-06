import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
      default: "percentage",
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (v) {
          if (this.type === "percentage") {
            return v <= 100;
          }
          return true;
        },
        message: "Percentage discount cannot exceed 100%",
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    applicablePackages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
      },
    ],
    minPurchaseAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxUsageCount: {
      type: Number,
      min: 1,
    },
    currentUsageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Pre-validate hook to check date logic
DiscountSchema.pre("validate", function (next) {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    return next(
      new Error("End date must be greater than or equal to start date")
    );
  }

  // Auto-expire discount if end date has passed
  if (this.endDate && this.endDate < new Date()) {
    this.status = "expired";
  }

  next();
});

// Indexes for better performance
DiscountSchema.index({ name: 1 });
DiscountSchema.index({ status: 1 });
DiscountSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model("Discount", DiscountSchema);
