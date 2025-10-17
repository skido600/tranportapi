import mongoose from "mongoose";

const userProfileImageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    images: [
      {
        originalName: { type: String, required: true },
        publicId: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const DriverTruckImg = mongoose.model("drivertruck", userProfileImageSchema);

export default DriverTruckImg;
