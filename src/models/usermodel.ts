import mongoose from "mongoose";
import { generateRandomCode } from "../utils/UserId.ts";
import type { AuthUser } from "../types/types.ts";
import { config } from "dotenv";
config();
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
    trip: {
      type: String,
      required: false,
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
    address: {
      type: String,
    },
    country: {
      type: String,
    },
    role: {
      type: String,
      enum: ["driver", "client", "admin"],
      required: true,
      default: "client",
    },
    image: {
      type: String,
      default: function () {
        if (this.role === "driver") {
          return `${
            process.env.SERVER_URL || "http://localhost:3001"
          }/images/vecteezy_driver-vector-icon-design_16425938.jpg`;
        }

        return `${
          process.env.SERVER_URL || "http://localhost:30001"
        }/images/images (2).png`;
      },
    },
    publicId: {
      type: String,
      default: "",
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
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
      this.userId = `DXL${randomPart}`;
    } else {
      this.userId = generateRandomCode();
    }
  }
  next();
});

const Auth = mongoose.model<AuthUser>("Auth", userSchema);

export default Auth;
