import mongoose from "mongoose";

// Trip schema
interface Trip {
  driver: mongoose.Schema.Types.ObjectId;
  origin: string;
  destination: string;
  date: Date;
  price: number;
  status: "pending" | "completed" | "cancelled";
  description?: string;
}

const tripSchema = new mongoose.Schema<Trip>(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
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
