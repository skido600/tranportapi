import { Request, Response, NextFunction } from "express";
import Auth from "../models/usermodel.ts";
interface AuthRequest extends Request {
  user?: {
    isVerified: boolean;
    isAdmin?: string;
    isDriver?: boolean;
    email?: string;
    full_name?: string;
    userId: string;
  };
}
export const isAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID" });
    }

    const user = await Auth.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isDriver) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
