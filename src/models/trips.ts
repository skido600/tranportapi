import mongoose from "mongoose";

// Trip schema
export interface Trip extends Document {
  driverId: mongoose.Schema.Types.ObjectId;
  customerId: mongoose.Schema.Types.ObjectId;
  origin: string;
  destination: string;
  date: Date;
  price: number;
  status: "pending" | "completed" | "cancelled";
  description?: string;
}
const tripSchema = new mongoose.Schema<Trip>(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    date: { type: Date, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    description: { type: String },
  },
  { timestamps: true }
);

const TripModel = mongoose.model("Trip", tripSchema);

export default TripModel;
