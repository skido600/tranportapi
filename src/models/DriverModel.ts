import mongoose from "mongoose";

import type { Driver } from "../types/types.ts";
const driverSchema = new mongoose.Schema(
  {
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    driverId: { type: String, unique: true },
    licenseNumber: { type: String, required: true },
    phone: { type: String, required: true },
    truckType: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    town: { type: String, required: true },
    price: { type: Number, required: true },
    isDriverRequest: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    description: {
      type: String,
      required: [true, "describe your work experince "],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "none"],
      default: "none",
    },
    experience: {
      type: Number,
      required: [true, "how many years experince did you have in driving"],
    },
    truckImagesDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "drivertruck",
      default: null,
    },
    isDriver: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Generate unique ID
driverSchema.pre("save", function (next) {
  if (!this.driverId) {
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    this.driverId = `DXL/${randomPart}`;
    console.log(`DXL/${randomPart}`);
  }
  next();
});

const Driver = mongoose.model<Driver>("Driver", driverSchema);

export default Driver;
