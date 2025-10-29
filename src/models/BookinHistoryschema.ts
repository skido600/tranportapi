import mongoose, { Schema } from "mongoose";

const BookingHistory = new Schema(
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

    price: {
      type: Number,
      required: true,
      min: 0,
    },
    tripDate: {
      type: Date,
      required: true,
    },
    message: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    trackingId: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

const BookingHistorysave = mongoose.model("bookinghistory", BookingHistory);

export default BookingHistorysave;
