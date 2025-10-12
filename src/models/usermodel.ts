import mongoose from "mongoose";
import { generateRandomCode } from "../utils/UserId.ts";
import type { AuthUser, Driver } from "../types/types.ts";

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      trim: true,
      required: true,
    },
    userName: { type: String, trim: true, required: true },
    email: {
      type: String,
      unique: [true, "Email must be unique"],
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    userId: {
      type: String,
      unique: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    resetCode: {
      type: String,
      required: false,
    },
    resetCodeExpire: { type: Date, required: false },
    verificationCodeExpires: { type: Date, required: false },
    refreshToken: { type: String, default: null, select: false },
    isDriver: { type: Boolean, default: false },
    isDriverRequest: { type: Boolean, default: false },
    ispremium: { type: Boolean, default: false },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  },

  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (this.isNew || !this.userId) {
    this.userId = generateRandomCode();
  }
  next();
});

const Auth = mongoose.model<AuthUser>("Auth", userSchema);

export default Auth;
