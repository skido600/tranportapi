import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    driverId: {
      type: String,
      required: true,
    },
    pickup: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    town: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 1000,
    },
    tripDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    trackingId: { type: String, default: null },
  },
  { timestamps: true }
);
const Trips = mongoose.model("Trip", tripSchema);

export default Trips;
