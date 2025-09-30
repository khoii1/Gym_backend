import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, maxlength: 150 },
    phone: { type: String, unique: true, sparse: true, maxlength: 20 },
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

export default mongoose.model("Member", MemberSchema);
