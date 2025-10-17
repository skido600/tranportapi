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
    // Country: {
    //   type: String,
    //   required: false,
    // },
    resetCodeExpire: { type: Date, required: false },
    verificationCodeExpires: { type: Date, required: false },
    refreshToken: { type: String, default: null, select: false },
    isDriver: { type: Boolean, default: false },
    isDriverRequest: { type: Boolean, default: false },
    ispremium: { type: Boolean, default: false },
    address: {
      type: String,
      required: function () {
        return this.role === "client";
      },
    },
    country: {
      type: String,
      required: function () {
        return this.role === "client";
      },
    },
    role: {
      type: String,
      enum: ["driver", "client"],
      required: true,
      default: "client",
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  },

  { timestamps: true }
);
userSchema.index({ email: "text" });
userSchema.pre("save", function (next) {
  if (this.isNew || !this.userId) {
    if (this.role === "driver") {
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
      this.userId = `DXL/${randomPart}`;
    } else {
      this.userId = generateRandomCode();
    }
  }
  next();
});
userSchema.pre("save", function (next) {
  if (this.role === "driver") {
    this.address = null;
    this.country = null;
  }
  next();
});

const Auth = mongoose.model<AuthUser>("Auth", userSchema);

export default Auth;
