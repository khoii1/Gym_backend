import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { ALL_ROLES, ROLES } from "../constants/roles.js";

const VerificationCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    purpose: { type: String, enum: ["verify", "reset"], required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, maxlength: 150 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ALL_ROLES, default: ROLES.MEMBER },
    isEmailVerified: { type: Boolean, default: false },
    codes: [VerificationCodeSchema],
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (plain) {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
};

export default mongoose.model("User", UserSchema);
