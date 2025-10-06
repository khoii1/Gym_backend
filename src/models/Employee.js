import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      maxlength: 150,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 150,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      maxlength: 20,
    },
    position: {
      type: String,
      required: true,
      maxlength: 100,
      comment: "Job position: Trainer, Manager, Reception, etc.",
    },
    department: {
      type: String,
      maxlength: 100,
      comment: "Department: Fitness, Administration, etc.",
    },
    salary: {
      type: Number,
      min: 0,
      comment: "Monthly salary in VND",
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },
    qualifications: [
      {
        type: String,
        maxlength: 150,
      },
    ],
    emergencyContact: {
      name: { type: String, maxlength: 150 },
      phone: { type: String, maxlength: 20 },
      relationship: { type: String, maxlength: 50 },
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ position: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ fullName: "text", email: "text" });

export default mongoose.model("Employee", EmployeeSchema);
