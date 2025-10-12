import mongoose from "mongoose";
export interface profileDetails extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orginalName: string;
  publicId: string;
  Url: string;
  createdAt: Date;
  updatedAt: Date;
}
const userProfileImageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      unique: true,
      required: true,
      ref: "Auth",
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
const profile = mongoose.model<profileDetails>(
  "profile",
  userProfileImageSchema
);

export default profile;
