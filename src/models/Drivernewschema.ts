import mongoose from "mongoose";
import { formatDistanceToNow } from "date-fns";

const driverNewsSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    newsTitle: {
      type: String,
      required: true,
      trim: true,
    },
    authorname: {
      type: String,
    },
    newsBody: {
      type: String,
      required: true,
    },
    image: {
      url: {
        type: String,
        required: false, // optional if some posts don't have images
      },
      public_id: {
        type: String,
        required: false, // needed to delete from Cloudinary later
      },
    },

    slug: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);
//Virtual field to show "how many days/hours ago"
driverNewsSchema.virtual("timeAgo").get(function () {
  return formatDistanceToNow(new Date(this.createdAt), { addSuffix: true });
});

//  Ensure virtuals appear in JSON responses
driverNewsSchema.set("toJSON", { virtuals: true });
driverNewsSchema.set("toObject", { virtuals: true });
const drivernews = mongoose.model("DriverNews", driverNewsSchema);

export default drivernews;
