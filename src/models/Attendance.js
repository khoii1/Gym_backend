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
    note: { type: String },
  },
  { timestamps: true }
);

// một hội viên không được trùng thời điểm check-in
AttendanceSchema.index({ member_id: 1, checkin_time: 1 }, { unique: true });

export default mongoose.model("Attendance", AttendanceSchema);
