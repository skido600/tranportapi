import type { Request, Response, NextFunction } from "express";
import { HandleResponse } from "../utils/Response.ts";
import Auth from "../models/usermodel.ts";
import DriverNews from "../models/Drivernewschema.ts";
import cloudinary from "../utils/cloudinary.ts";
import { createNewsSchema } from "../validators/validation.ts";

const helperSlug = (title: string, id: string, driverId: string): string => {
  const formattedTitle = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  // Prevent error if driverId is undefined
  const safeDriverId = driverId ? driverId.replace(/\//g, "-") : "";

  return `${formattedTitle}-${id}-${safeDriverId}`;
};

export async function createDriverNews(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?._id;
    const { newsTitle, newsBody, image } = req.body;
    console.log("Incoming body:", req.body);
    if (!userId) {
      return HandleResponse(res, false, 401, "User not authenticated");
    }

    const user = await Auth.findById(userId);
    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }

    if (user.role !== "driver") {
      return HandleResponse(res, false, 403, "This news is for drivers only");
    }

    const { error } = createNewsSchema.validate({
      newsTitle,
      newsBody,
    });
    if (error) {
      return HandleResponse(
        res,
        false,
        400,
        error?.details[0]?.message as string
      );
    }
    let imageData = null;
    if (!req.file) {
      return HandleResponse(res, false, 400, "Image file is required");
    }
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        folder: "driver_news",
        resource_type: "image",
      });

      imageData = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    // ✅ Create the driver news first
    const newNews = await DriverNews.create({
      driverId: userId,
      newsTitle,
      newsBody,
      authorname: user.full_name,
      image: imageData,
    });

    newNews.slug = helperSlug(
      newsTitle,
      newNews._id.toString(),
      user.userId.toString()
    );
    await newNews.save();

    console.log("created stuff", newNews);
    return HandleResponse(
      res,
      true,
      201,
      "Driver news created successfully",
      newNews
    );
  } catch (error) {
    next(error);
  }
}
export async function getDriverNewsBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { slug } = req.params;

    const news = await DriverNews.findOne({ slug }).populate(
      "driverId",
      "full_name email"
    );
    console.log("slug", news);
    if (!news) {
      return HandleResponse(res, false, 404, "News not found");
    }

    return HandleResponse(
      res,
      true,
      200,
      "Driver news fetched successfully",
      news
    );
  } catch (error) {
    next(error);
  }
}

//get each driver news
export async function GetEachDrivernews(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return HandleResponse(res, false, 401, "User not authenticated");
    }

    const driverNewsdetails = await DriverNews.find({ driverId: userId });
    console.log(driverNewsdetails);
    if (!driverNewsdetails || driverNewsdetails.length === 0) {
      return HandleResponse(
        res,
        false,
        404,
        "No news found — make a post for your fellow drivers."
      );
    }

    return HandleResponse(
      res,
      true,
      200,
      "Driver news fetched successfully",
      driverNewsdetails
    );
  } catch (error) {
    next(error);
  }
}

export async function deleteDriverNews(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!userId) {
      return HandleResponse(res, false, 401, "User not authenticated");
    }

    const news = await DriverNews.findById(id);
    if (!news) {
      return HandleResponse(res, false, 404, "News not found");
    }

    // ✅ Make sure user owns the post
    if (news.driverId.toString() !== userId.toString()) {
      return HandleResponse(
        res,
        false,
        403,
        "You are not allowed to delete this post"
      );
    }

    // ✅ Delete image from Cloudinary (if exists)
    if (news.image?.public_id) {
      await cloudinary.uploader.destroy(news.image.public_id);
    }

    // ✅ Delete post from DB
    await news.deleteOne();

    return HandleResponse(res, true, 200, "Driver news deleted successfully");
  } catch (error) {
    next(error);
  }
}
