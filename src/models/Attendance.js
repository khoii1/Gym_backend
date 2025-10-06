import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    registration_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageRegistration",
      required: true,
    },
    checkin_time: { type: Date, required: true },
    checkout_time: { type: Date },
    workout_duration: { type: Number }, // minutes
    status: {
      type: String,
      enum: ["checked_in", "completed", "cancelled"],
      default: "checked_in",
    },
    note: { type: String },

    // Additional tracking
    check_in_method: {
      type: String,
      enum: ["manual", "qr_code", "card", "mobile_app"],
      default: "manual",
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
AttendanceSchema.index({ member_id: 1, checkin_time: -1 });
AttendanceSchema.index({ checkin_time: 1 });
AttendanceSchema.index({ status: 1 });

export default mongoose.model("Attendance", AttendanceSchema);
