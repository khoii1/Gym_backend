import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, maxlength: 150 },
    role: { type: String, required: true, maxlength: 50 }, // Trainer, Reception, Manager…
    email: {
      type: String,
      unique: true,
      sparse: true,
      maxlength: 150,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", EmployeeSchema);
