import type { Request, Response, NextFunction } from "express";
import { HandleResponse } from "../utils/Response.ts";
import Driver from "../models/DriverModel.ts";
import Auth from "../models/usermodel.ts";
import DriverTruckImg from "../models/DriverTruckImagemodel.ts";
interface AuthRequest extends Request {
  user?: {
    isVerified: boolean;
    isAdmin?: string;
    email?: string;
    full_name?: string;
    userId: string;
  };
}
export async function profileDetails(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authId = req.user?.userId;
    if (!authId) {
      return HandleResponse(res, false, 400, "You must be authenticated");
    }
    const user = await Auth.findById(authId).populate("driver");

    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }
    const userData = {
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      userName: user.userName,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
      isDriver: user.isDriver,
      isDriverRequest: user.isDriverRequest,
      isPremium: user.ispremium,
      phone: user.driver?.phone ?? null,
      driverStatus: user.driver?.status ?? "none",

      driverDetails: user.isDriver
        ? {
            driverId: user.driver?.driverId ?? null,
            driverLicense: user.driver?.licenseNumber ?? null,
            driverVehicle: user.driver?.vehicle ?? null,
            driverExperience: user.driver?.experience ?? null,
            driverrequestStatus: user.driver.status,
          }
        : false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    HandleResponse(res, true, 200, "user details fetch sucessfully", userData);
  } catch (error) {
    next(error);
  }
}
