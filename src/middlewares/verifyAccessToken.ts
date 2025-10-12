import { ACCESS_TOKEN_SECRET } from "../utils/dotenv.ts";
import type { Request, Response, NextFunction } from "express";
import pkg from "jsonwebtoken";

const { verify } = pkg;

interface AuthRequest extends Request {
  user?: {
    isVerified: boolean;
    isAdmin?: string;
    email?: string;
    full_name?: string;
    userId: string;
  };
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const decoded = verify(token, ACCESS_TOKEN_SECRET!) as {
      userId: string;
      email?: string;
      isVerified: boolean;
    };

    req.user = decoded;
    return next();
  } catch (err: any) {
    console.log("Access token expired, trying to refresh...");
    // if (err.name === "TokenExpiredError") {
    //   console.log("Access token expired, trying to refresh...");
    // }
  }
};
