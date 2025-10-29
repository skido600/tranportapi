import type { Request, Response, NextFunction } from "express";
import { HandleResponse } from "../utils/Response.ts";
import Driver from "../models/DriverModel.ts";
import Auth from "../models/usermodel.ts";
import cloudinary from "../utils/cloudinary.ts";
import DriverTruckImg from "../models/DriverTruckImagemodel.ts";

interface AuthRequest extends Request {
  user?: {
    isVerified: boolean;
    isAdmin?: string;
    email?: string;
    full_name?: string;
    userId: string;
    _id: string;
  };
}

export async function getClientProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return HandleResponse(res, false, 400, "You must be authenticated");
    }

    const user = await Auth.findById(authId);
    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }

    if (user.role !== "client") {
      return HandleResponse(res, false, 403, "Not a client account");
    }

    const clientData = {
      userId: user._id,
      full_name: user.full_name,
      email: user.email,
      userName: user.userName,
      isAdmin: user.isAdmin,
      role: user.role,
      updatedAt: user.updatedAt,
      createdAt: user.createdAt,
      image: user.image,
    };

    HandleResponse(
      res,
      true,
      200,
      "Client profile fetched successfully",
      clientData
    );
  } catch (error) {
    next(error);
  }
}

export async function getDriverProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return HandleResponse(res, false, 400, "You must be authenticated");
    }

    const user = await Auth.findById(authId).select("+driver");

    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }

    if (user.role !== "driver") {
      return HandleResponse(res, false, 403, "Not a driver account");
    }

    const driverData = {
      userId: user._id,
      full_name: user.full_name,
      email: user.email,
      userName: user.userName,
      role: user.role,
      updatedAt: user.updatedAt,
      image: user.image,
      address: user.address,
      country: user.country,
    };

    HandleResponse(
      res,
      true,
      200,
      "Driver profile fetched successfully",
      driverData
    );
  } catch (error) {
    next(error);
  }
}
export const updateProfileImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId) return HandleResponse(res, false, 401, "Unauthorized");
    const user = await Auth.findById(userId);
    if (!user) return HandleResponse(res, false, 404, "User not found");
    if (!req.file) return HandleResponse(res, false, 404, "image not found");

    if (user.publicId) {
      await cloudinary.uploader.destroy(user.publicId);
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "user_dp",
    });

    user.image = result.secure_url;
    user.publicId = result.public_id;
    await user.save();
    HandleResponse(res, true, 200, "Profile updated successfully", user);
  } catch (err) {
    next(err);
  }
};
export const updateDriverDetails = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?._id;

    if (!authId) {
      return HandleResponse(res, false, 400, "Not a valid user");
    }

    const authUser = await Auth.findById(authId);
    if (!authUser) {
      return HandleResponse(res, false, 404, "User not found");
    }

    if (authUser.role !== "driver") {
      return HandleResponse(res, false, 403, "This update is for drivers only");
    }

    // Get the driver's data by authId
    const driver = await Driver.findOne({ authId });
    if (!driver) {
      return HandleResponse(res, false, 404, "Driver record not found");
    }

    const {
      name,
      licenseNumber,
      state,
      town,
      country,
      price,
      discountPrice,
      deletePublicIds,
    } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (licenseNumber) updateData.licenseNumber = licenseNumber;
    if (state) updateData.state = state;
    if (town) updateData.town = town;
    if (country) updateData.country = country;
    if (price !== undefined) updateData.price = price;
    if (discountPrice !== undefined) updateData.discountPrice = discountPrice;

    const updatedDriver = await Driver.findByIdAndUpdate(
      driver._id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    //  Handle image deletion
    if (deletePublicIds && Array.isArray(deletePublicIds)) {
      for (const publicId of deletePublicIds) {
        await cloudinary.uploader.destroy(publicId); // delete from Cloudinary
      }

      await DriverTruckImg.updateOne(
        { userId: driver._id },
        { $pull: { images: { publicId: { $in: deletePublicIds } } } }
      );
    }

    // Handle new image uploads
    if (req.files && Array.isArray(req.files)) {
      const uploadedImages = [];

      for (const file of req.files as Express.Multer.File[]) {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "drivers/trucks",
        });

        uploadedImages.push({
          originalName: file.originalname,
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url,
        });
      }

      await DriverTruckImg.updateOne(
        { userId: driver._id },
        { $push: { images: { $each: uploadedImages } } }
      );
    }

    const finalDriver = await Driver.findById(driver._id)
      .populate("truckImagesDriver")
      .lean();

    return HandleResponse(
      res,
      true,
      200,
      "Driver updated successfully",
      finalDriver
    );
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    let filter: any = {};

    if (search) {
      filter = {
        $or: [
          { full_name: { $regex: search as string, $options: "i" } },
          { userId: search },
        ],
      };
    }

    const users = await Auth.find(filter);

    HandleResponse(res, true, 200, "Users fetched successfully", users);
  } catch (err: any) {
    HandleResponse(res, false, 500, err.message);
  }
};

export async function DeleteUserData(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return HandleResponse(res, false, 400, "User ID is required");
    }

    // 1s Delete user from Auth
    await Auth.findByIdAndDelete(userId);

    return HandleResponse(res, true, 200, "All user data successfully deleted");
  } catch (error) {
    console.error("Error deleting user data:", error);
    next(error);
  }
}
