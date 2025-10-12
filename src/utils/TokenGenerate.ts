import jwt from "jsonwebtoken";
import { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } from "./dotenv.ts";

export const generateAccessToken = (user: any) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
      full_name: user.full_name,
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m",
    }
  );
};

export const generateRefreshToken = (user: any) => {
  return jwt.sign({ id: user._id, email: user.email }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};
