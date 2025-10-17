import type { Request, Response, NextFunction } from "express";
import { HandleResponse } from "../utils/Response.ts";
import Driver from "../models/DriverModel.ts";
import Auth from "../models/usermodel.ts";
import DriverTruckImg from "../models/DriverTruckImagemodel.ts";
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
export async function profileDetails(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authId = req.user?._id;
    if (!authId) {
      return HandleResponse(res, false, 400, "You must be authenticated");
    }
    const user = await Auth.findById(authId).populate("driver");

    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }

    // await updateUserAdmin(authId);
    HandleResponse(
      res,
      true,
      200,
      "user details fetch sucessfully",

      {
        userId: user._id,
        full_name: user.full_name,
        email: user.email,
        userName: user.userName,
        isAdmin: user.isAdmin,
        isDriver: user.isDriver,
        driverStatus: user.driver?.status ?? "none",
        updatedAt: user.updatedAt,
      }
    );
  } catch (error) {
    next(error);
  }
}

// export async function updateUserAdmin(userId: string) {
//   // 1️⃣ Fetch user from DB and populate driver
//  const user = await Auth.findById(userId).populate("driver").lean();
//   if (!user) throw new Error("User not found");

//   // 2️⃣ Optional: if you want to make some manual changes, do them here
//   // Example: user.isDriver = true; (or any other manual DB updates)
//   // await user.save(); // save only if you make changes

//   // 3️⃣ Prepare payload for socket emit
//   const payload = {
//     userId: user._id,
//     full_name: user.full_name,
//     email: user.email,
//     userName: user.userName,
//     isAdmin: user.isAdmin,
//     isDriver: user.isDriver,
//     driverStatus: user.driver?.status ?? "none",
//     updatedAt: user.updatedAt,
//   };

//   // 4️⃣ Emit to the specific user
//   const io = getIo();
//   io.to(userId).emit("userUpdated", payload);

//   return payload;
// }
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query; // single param

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
    console.log(users);
    HandleResponse(res, true, 200, "Users fetched successfully", users);
  } catch (err: any) {
    HandleResponse(res, false, 500, err.message);
  }
};
