import mongoose from "mongoose";

const WorkScheduleSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      comment: "The date of the work schedule",
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      comment: "Start time in HH:mm format",
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      comment: "End time in HH:mm format",
    },
    shiftType: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night", "full-day"],
      default: "morning",
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "absent"],
      default: "scheduled",
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Custom validation to ensure endTime is after startTime
WorkScheduleSchema.pre("validate", function (next) {
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(":").map(Number);
    const [endHour, endMin] = this.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return next(new Error("Thời gian kết thúc phải sau thời gian bắt đầu"));
    }
  }
  next();
});

// Indexes for better performance
WorkScheduleSchema.index({ employeeId: 1, date: 1 });
WorkScheduleSchema.index({ date: 1 });
WorkScheduleSchema.index({ status: 1 });

export default mongoose.model("WorkSchedule", WorkScheduleSchema);
