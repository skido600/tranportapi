import type { Request, Response, NextFunction } from "express";
import { Driverdetails } from "../validators/validation.ts";
import { HandleResponse } from "../utils/Response.ts";
import Driver from "../models/DriverModel.ts";
import Auth from "../models/usermodel.ts";
import DriverTruckImg from "../models/DriverTruckImagemodel.ts";
import cloudinary from "../utils/cloudinary.ts";
import NotificationModel from "../models/notificationModel.ts";
import { getIo } from "../utils/socket.ts";

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
// interface TruckImagesDriver {
//   images: {
//     originalName: string;
//     publicId: string;
//     url: string;
//   }[];
// }

//DRIVER APPLICATION
async function Drivercontroller(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      licenseNumber,
      phone,
      truckType,
      country,
      state,
      town,
      price,
      experience,
      description,
    } = req.body;

    const { error } = Driverdetails.validate({
      licenseNumber,
      phone,
      truckType,
      country,
      experience,
      state,
      town,
      price,
      description,
    });

    if (error) {
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }

    const authId = req.user?._id;
    console.log("testing something", authId);
    if (!authId) {
      return HandleResponse(res, false, 400, "You must be authenticated");
    }

    // Check if user already has a pending/approved driver request
    const existingDriver = await Driver.findOne({ authId });

    if (existingDriver) {
      if (existingDriver.status === "approved") {
        return HandleResponse(
          res,
          false,
          400,
          "Your request has already been approved. Don't apply again."
        );
      }
      if (existingDriver.status === "pending") {
        return HandleResponse(
          res,
          false,
          400,
          "Your driver request is still pending admin approval."
        );
      }
    }
    // Validate uploaded files
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return HandleResponse(
        res,
        false,
        400,
        "Please upload at least one image of your truck or vehicle."
      );
    }
    // Create driver request
    const driver = await Driver.create({
      authId,
      licenseNumber,
      phone,
      truckType,
      country,
      state,
      isDriverRequest: true,
      town,
      price,
      description,
      experience,
      status: "pending",
    });

    const uploadedImages = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "driver_trucks",
          resource_type: "image",
        });
        return {
          originalName: file.originalname,
          publicId: result.public_id,
          url: result.secure_url,
        };
      })
    );

    const Drivertruck = new DriverTruckImg({
      userId: driver._id,
      images: uploadedImages,
    });
    const user = await Auth.findById(authId);
    // console.log("again", user);
    if (!user) {
      return HandleResponse(res, false, 400, "user not found");
    }
    user.isDriverRequest = true;
    user.driver = driver._id;
    await user.save();
    await Drivertruck.save();
    driver.truckImagesDriver = Drivertruck._id;
    await driver.save();

    const io = getIo();

    // Notify user via DB + socket
    const userNotification = await NotificationModel.create({
      userId: authId,
      message: "Your driver request is pending admin approval",
      status: "pending",
    });
    io.to(user.userId).emit("driver_status_update", userNotification);

    const admins = await Auth.find({ isAdmin: true });
    if (admins.length > 0) {
      const adminNotifications = admins.map((admin) => ({
        userId: admin._id,
        message: `${user.full_name} has submitted a new driver application.`,
      }));
      await NotificationModel.insertMany(adminNotifications);
    }

    HandleResponse(
      res,
      true,
      201,
      "Driver application submitted. Waiting for admin approval.",
      driver
    );
  } catch (error) {
    next(error);
  }
}
export const getUserNotifications = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return HandleResponse(res, false, 400, "User not authenticated");

    const notifications = await NotificationModel.find({ userId })
      .sort({
        createdAt: -1,
      })
      .limit(1);
    console.log(notifications);
    HandleResponse(res, true, 200, "User notifications", notifications);
  } catch (err) {
    next(err);
  }
};
//ADMIN GET ALL DRIVER REQUESTS
async function AdminGetAllRequestedDriver(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const drivers = await Driver.find({
      isDriverRequest: true,
      status: "pending",
    }).populate("truckImagesDriver");

    // console.log(drivers);
    const cleanedDrivers = drivers.map((driver) => ({
      _id: driver._id,
      state: driver.state,
      town: driver.town,
      country: driver.country,
      driverId: driver.driverId,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      images: (driver?.truckImagesDriver as any)?.images || [],
    }));

    HandleResponse(res, true, 200, "Requested drivers", cleanedDrivers);
  } catch (error) {
    next(error);
  }
}

async function AdminAcceptDriverRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const driverId = req.params.driverid;
    if (!driverId)
      return HandleResponse(res, false, 400, "Driver ID is required");

    const driver = await Driver.findById(driverId).populate("authId isDriver");
    console.log("driver accesp", driver);
    if (!driver) return HandleResponse(res, false, 404, "Driver not found");

    const user = await Auth.findById(driver.authId);
    if (!user) return HandleResponse(res, false, 404, "User not found");
    if (driver.status === "approved") {
      return HandleResponse(
        res,
        false,
        400,
        "Driver has already been approved"
      );
    }
    driver.status = "approved";
    driver.isDriver = true;
    await driver.save();
    user.isDriver = false;
    await user.save();
    const io = getIo();

    const userNotification = await NotificationModel.create({
      userId: user._id,
      message: "Your driver request has been approved by admin.",
      status: "approved",
    });
    io.to(user.userId).emit("driver_status_update", userNotification);

    HandleResponse(res, true, 200, "Driver request approved successfully");
  } catch (error) {
    next(error);
  }
}

// ADMIN REJECT DRIVER REQUEST
async function AdminRejectDriverRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // if (!req.user?.isAdmin) {
    //   return HandleResponse(res, false, 403, "You must be admin");
    // }

    const driverId = req.params.driverid;
    if (!driverId) {
      return HandleResponse(res, false, 400, "Driver ID is required");
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return HandleResponse(res, false, 404, "Driver not found");
    }

    const user = await Auth.findById(driver.authId);
    if (!user) return HandleResponse(res, false, 404, "User not found");

    driver.status = "rejected";
    driver.isDriver = false;
    await driver.save();
    user.isDriver = false;
    await user.save();
    const io = getIo();

    // Notify user via DB + socket
    const userNotification = await NotificationModel.create({
      userId: user?.userId,
      message: `Your driver request has been rejected by admin.`,
      status: "approved",
    });

    io.to(user.userId).emit("driver_status_update", userNotification);

    HandleResponse(res, true, 200, "Driver request rejected successfully");
  } catch (error) {
    next(error);
  }
}
async function GeteachDriverRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authId = req.user?._id;
    console.log("testing something", authId);
    if (!authId) {
      return HandleResponse(res, false, 400, "You must be authenticated");
    }
    const userdetails = await Driver.find({ authId: authId }).populate(
      "truckImagesDriver"
    );

    if (userdetails.length === 0 || !userdetails) {
      return HandleResponse(res, false, 400, "user not found or empty user");
    }
    HandleResponse(
      res,
      true,
      200,
      `hey ${req.user?.full_name}  thid your request order`,
      userdetails
    );
  } catch (err) {
    next(err);
  }
}
//update
// UPDATE DRIVER DETAILS
// UPDATE DRIVER DETAILS
async function UpdateDriverInfo(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authId = req.user?._id;
    if (!authId)
      return HandleResponse(res, false, 400, "You must be authenticated");

    const { description, town, country, state, phone, price } = req.body;

    // Ensure at least one field is updated
    if (
      !description &&
      !country &&
      !town &&
      !state &&
      !phone &&
      !price &&
      (!req.files || req.files.length === 0)
    ) {
      return HandleResponse(
        res,
        false,
        400,
        "Please update at least one field"
      );
    }

    const driver = await Driver.findOne({ authId }).populate(
      "truckImagesDriver"
    );
    if (!driver) return HandleResponse(res, false, 404, "Driver not found");

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const currentImages = (driver?.truckImagesDriver as any)?.images || [];
      const totalImages = currentImages.length + req.files.length;

      if (totalImages > 5) {
        return HandleResponse(
          res,
          false,
          400,
          `You can only have a maximum of 5 images. You currently have ${currentImages.length}.`
        );
      }

      const uploadedImages = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "driver_trucks",
            resource_type: "image",
          });
          return {
            originalName: file.originalname,
            publicId: result.public_id,
            url: result.secure_url,
          };
        })
      );

      if (driver.truckImagesDriver) {
        await DriverTruckImg.findByIdAndUpdate(driver.truckImagesDriver._id, {
          $push: { images: { $each: uploadedImages } },
        });
      } else {
        const newImageDoc = await DriverTruckImg.create({
          userId: driver._id,
          images: uploadedImages,
        });
        driver.truckImagesDriver = newImageDoc._id;
      }
    }

    // Update text fields
    if (description) driver.description = description;
    if (country) driver.country = country;
    if (town) driver.town = town;
    if (state) driver.state = state;
    if (phone) driver.phone = phone;
    if (price) driver.price = price;
    await driver.save();

    const updatedDriver = await Driver.findOne({ authId }).populate(
      "truckImagesDriver"
    );
    HandleResponse(
      res,
      true,
      200,
      "Driver info updated successfully",
      updatedDriver
    );
  } catch (err) {
    next(err);
  }
}

async function DeleteDriverImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authId = req.user?._id;
    if (!authId)
      return HandleResponse(res, false, 400, "You must be authenticated");

    const { imageId } = req.params;

    // Find the driver with populated images
    const driver = await Driver.findOne({ authId }).populate(
      "truckImagesDriver"
    );
    if (!driver) return HandleResponse(res, false, 404, "Driver not found");

    const truckImages = driver.truckImagesDriver;
    if (!truckImages || !truckImages.images.length)
      return HandleResponse(res, false, 404, "No truck images found");

    // Find the image to delete
    const image = truckImages.images.find(
      (img: any) => img._id.toString() === imageId
    );
    if (!image) return HandleResponse(res, false, 404, "Image not found");

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.publicId);

    // Remove from MongoDB using $pull
    await DriverTruckImg.findByIdAndUpdate(truckImages._id, {
      $pull: { images: { _id: imageId } },
    });

    const updatedTruckImages = await DriverTruckImg.findById(truckImages._id);

    HandleResponse(
      res,
      true,
      200,
      "Image deleted successfully",
      updatedTruckImages
    );
  } catch (err) {
    next(err);
  }
}

// async function UpdateDp(
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const userId = req.user?._id;
//     if (!userId) return HandleResponse(res, false, 401, "Unauthorized");
//     const user = await Auth.findById(userId);
//     if (!user) return HandleResponse(res, false, 404, "User not found");
//     if (!req.file) return HandleResponse(res, false, 404, "image not found");

//     if (user.publicId) {
//       await cloudinary.uploader.destroy(user.publicId);
//     }
//     // Upload new image
//     const result = await cloudinary.uploader.upload(req.file.path, {
//       folder: "user_dp",
//     });

//     user.image = result.secure_url;
//     user.publicId = result.public_id;
//     await user.save();
//     HandleResponse(res, true, 200, "Profile updated successfully", user);
//   } catch (err) {
//     next(err);
//   }
// }

export default {
  // UpdateDp,
  Drivercontroller,
  AdminGetAllRequestedDriver,
  GeteachDriverRequest,
  UpdateDriverInfo,
  DeleteDriverImage,
  AdminAcceptDriverRequest,
  AdminRejectDriverRequest,
};
