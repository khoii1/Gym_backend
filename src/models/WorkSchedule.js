import mongoose from "mongoose";

const WorkScheduleSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
  },
  { timestamps: true }
);

WorkScheduleSchema.pre("validate", function (next) {
  if (this.start_time && this.end_time && !(this.end_time > this.start_time)) {
    return next(new Error("end_time phải lớn hơn start_time"));
  }
  next();
});

export default mongoose.model("WorkSchedule", WorkScheduleSchema);
