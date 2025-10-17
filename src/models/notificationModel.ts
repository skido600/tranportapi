import mongoose, { Document, Schema } from "mongoose";

export interface Notification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
  status: "pending" | "approved" | "rejected";
  updatedAt: Date;
}

const notificationSchema = new Schema<Notification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const NotificationModel = mongoose.model<Notification>(
  "Notification",
  notificationSchema
);

export default NotificationModel;
