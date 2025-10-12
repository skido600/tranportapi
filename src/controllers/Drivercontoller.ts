import type { Request, Response, NextFunction } from "express";
import { Driverdetails } from "../validators/validation.ts";
import { HandleResponse } from "../utils/Response.ts";
import Driver from "../models/DriverModel.ts";
import Auth from "../models/usermodel.ts";
import DriverTruckImg from "../models/DriverTruckImagemodel.ts";
import cloudinary from "../utils/cloudinary.ts";

interface AuthRequest extends Request {
  user?: {
    isVerified: boolean;
    isAdmin?: string;
    email?: string;
    full_name?: string;
    userId: string;
  };
}

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

    const authId = req.user?.userId;
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

    // Create driver request
    const driver = await Driver.create({
      authId,
      licenseNumber,
      phone,
      truckType,
      country,
      state,
      town,
      price,
      description,
      experience,
      status: "pending",
    });

    // Validate uploaded files
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return HandleResponse(
        res,
        false,
        400,
        "Please upload at least one image of your truck or vehicle."
      );
    }

    const uploadedImages = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path);
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
    if (!user) {
      return HandleResponse(res, false, 400, "user not found");
    }
    user.driver = driver._id;
    await user.save();
    await Drivertruck.save();
    driver.truckImagesDriver = Drivertruck._id;
    await driver.save();
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

//ADMIN GET ALL DRIVER REQUESTS
async function AdminGetAllRequestedDriver(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // if (!req.user?.isAdmin) {
    //   return HandleResponse(res, false, 403, "You must be admin");
    // }

    // Fetch all pending driver requests
    const drivers = await Driver.find({ status: "pending" })
      .populate("authId", "full_name email  isDriver")
      .populate("truckImagesDriver");

    HandleResponse(res, true, 200, "Requested drivers", drivers);
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
    if (!req.user?.isAdmin) {
      return HandleResponse(res, false, 403, "You must be admin");
    }

    const driverId = req.params.driverid;
    if (!driverId) {
      return HandleResponse(res, false, 400, "Driver ID is required");
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return HandleResponse(res, false, 404, "Driver not found");
    }

    const user = await Auth.findById(driver.authId);
    if (!user) {
      return HandleResponse(res, false, 404, "Associated user not found");
    }

    // Update driver and user
    driver.status = "approved";
    await driver.save();

    user.isDriver = true;
    await user.save();

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
    if (!req.user?.isAdmin) {
      return HandleResponse(res, false, 403, "You must be admin");
    }

    const driverId = req.params.driverid;
    if (!driverId) {
      return HandleResponse(res, false, 400, "Driver ID is required");
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return HandleResponse(res, false, 404, "Driver not found");
    }

    const user = await Auth.findById(driver.authId);
    if (!user) {
      return HandleResponse(res, false, 404, "Associated user not found");
    }

    // Update driver and user
    driver.status = "rejected";
    await driver.save();

    user.isDriver = false;
    await user.save();

    HandleResponse(res, true, 200, "Driver request rejected successfully");
  } catch (error) {
    next(error);
  }
}

export default {
  Drivercontroller,

  AdminGetAllRequestedDriver,
  AdminAcceptDriverRequest,
  AdminRejectDriverRequest,
};
