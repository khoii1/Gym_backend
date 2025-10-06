import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, maxlength: 150 },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 150,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, maxlength: 20 },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    address: { type: String, maxlength: 500 },

    // Membership info
    membershipNumber: {
      type: String,
      unique: true,
      required: true,
    },
    joinDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "cancelled"],
      default: "active",
    },

    // Emergency contact
    emergencyContact: {
      name: { type: String, maxlength: 150 },
      phone: { type: String, maxlength: 20 },
      relationship: { type: String, maxlength: 50 },
    },

    // Additional info
    notes: { type: String, maxlength: 1000 },
    profileImage: { type: String }, // URL to image

    // Tracking
    lastVisit: { type: Date },
    totalVisits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for better performance
// Note: email and membershipNumber already have unique indexes from schema definition
MemberSchema.index({ fullName: "text", email: "text" });

export default mongoose.model("Member", MemberSchema);
