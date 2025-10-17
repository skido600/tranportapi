import {
  type Request,
  type Response,
  type NextFunction,
  response,
} from "express";
import { HandleResponse } from "../utils/Response.ts";
import type { SignupType, LoginType } from "../types/types.ts";
import {
  ResetPassword,
  Firstemailvalidate,
  Verifycode,
} from "../validators/validation.ts";
import { MailService } from "../utils/sendEmails.ts";
const mailService = new MailService();
import Auth from "../models/usermodel.ts";
import argon2 from "argon2";

import { HMAC_VERIFICATION_CODE_SECRET } from "../utils/dotenv.ts";

import Otpcode from "../utils/genarateOtp.ts";
import { hmacProcess } from "../utils/hmacprocess.ts";
import {
  forgotPasswordService,
  LoginService,
  refreshTokenVerify,
  registerUser,
  resetPasswordService,
  verifyCodeService,
  verifyEmailService,
} from "../services/auth.service.ts";
import { formatDate } from "../utils/createdAtformater.ts";
import client from "../utils/Redis.ts";
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

async function Signup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      full_name,
      email,
      userName,
      password,
      confirmPassword,
      address,
      country,
      role,
    }: // Phone_Number,
    SignupType = req.body;

    const user = await registerUser(
      full_name,
      email,
      userName,
      password,
      confirmPassword,
      address,
      country,
      role
    );
    // console.log(user);

    HandleResponse(
      res,
      true,
      201,
      "User registered successfully. Check your email for verification.",
      {
        username: userName,
        email: user.email,
        isVerified: user.isVerified,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User already exists") {
        return HandleResponse(res, false, 409, error.message);
      } else if (error.message === "Passwords do not match") {
        return HandleResponse(res, false, 404, error.message);
      } else {
        next(error);
      }
    }
  }
}

async function VerifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.query.token as string;
    const message = await verifyEmailService(token);

    HandleResponse(res, true, 200, message);
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message === "Verification token is required") {
        return HandleResponse(res, false, 400, error.message);
      } else if (error.message === "User not found") {
        return HandleResponse(res, false, 404, error.message);
      } else if (
        error.message ===
        "Verification link has expired. Please request a new one. when you want to login"
      ) {
        return HandleResponse(res, false, 404, error.message);
      } else if (error.message === "user already verified") {
        return HandleResponse(res, false, 409, error.message);
      } else {
        next(error);
      }
    }
  }
}
async function Login(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { Email_Username, password }: LoginType = req.body;
    const response = await LoginService(Email_Username, password);

    res.cookie("refreshToken", response.refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", response.accesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    let userdetails: {
      userId?: string;
      full_name?: string;
      address?: string | null;
      country?: string | null;
      role?: string;
      MemberSince?: any;
      email?: any;
      userName?: any;
      isAdmin?: any;
    } = {};

    if (response.user.role === "driver") {
      userdetails.userId = response.user.userId;
      userdetails.full_name = response.user.full_name;
      userdetails.role = response.user.role;
      userdetails.MemberSince = formatDate(response.user.createdAt);
      userdetails.email = response.user.email;
      userdetails.userName = response.user.userName;
      userdetails.isAdmin = response.user.isAdmin;
    } else {
      userdetails.userId = response.user.userId;
      userdetails.full_name = response.user.full_name;
      userdetails.address = response.user.address;
      userdetails.country = response.user.country;
      userdetails.role = response.user.role;
      userdetails.MemberSince = formatDate(response.user.createdAt);
      userdetails.email = response.user.email;
      userdetails.userName = response.user.userName;
      userdetails.isAdmin = response.user.isAdmin;
    }

    // console.log(userdetails);
    HandleResponse(res, true, 200, "Login successful ✍🏻", userdetails);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return HandleResponse(res, false, 404, error.message);
      } else if (error.message === "Incorrect password") {
        return HandleResponse(res, false, 400, error.message);
      } else if (
        error.message ===
        "Verification link expired. A new link has been sent to your email."
      ) {
        return HandleResponse(res, false, 401, error.message);
      } else if (
        error.message ===
        "Email not verified. A new verification link has been sent to your email."
      ) {
        return HandleResponse(res, false, 409, error.message);
      } else {
        next(error);
      }
    }
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies.refreshToken;

    const refreshed = await refreshTokenVerify(token);

    res.cookie("accessToken", refreshed.newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return HandleResponse(res, true, 200, refreshed.message);
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message === "No refresh token provided") {
        return HandleResponse(res, false, 401, error.message);
      } else if (error.message === "User not found") {
        return HandleResponse(res, false, 404, error.message);
      } else if (error.message === "Invalid refresh token") {
        return HandleResponse(res, false, 403, error.message);
      } else {
        next(error);
      }
    }
  }
}

//forget password
const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const forgetpasswordres = await forgotPasswordService(email);

    return HandleResponse(
      res,
      true,
      200,
      forgetpasswordres.message,
      forgetpasswordres.email
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User not found invalid email or username") {
        return HandleResponse(res, false, 400, error.message);
      } else {
        next(error);
      }
    }
  }
};

//  verifyCode
export const verifyCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code } = req.body;
    await verifyCodeService(email, code);

    return HandleResponse(res, true, 200, "Code verified sucessfully");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return HandleResponse(res, false, 404, error.message);
      } else if (error.message === "Invalid or expired code") {
        return HandleResponse(res, false, 400, error.message);
      } else {
        next(error);
      }
    }
  }
};

//resetpassword
const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code, newPassword, confirmNewpassword } = req.body;

    await resetPasswordService(email, code, newPassword, confirmNewpassword);

    return HandleResponse(res, true, 200, "Password reset successful");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Passwords do not match") {
        return HandleResponse(res, false, 400, error.message);
      } else if (error.message === "User not found") {
        return HandleResponse(res, false, 404, error.message);
      } else if (error.message === "Invalid or expired code") {
        return HandleResponse(res, false, 400, error.message);
      } else {
        next(error);
      }
    }
  }
};

//logout
export async function logout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!res.clearCookie) {
      throw new Error("res is not an Express Response object");
    }
    const userId = req.user?._id;

    if (userId) {
      await client.del(`refresh:${userId}`);
      // const user = await Auth.findById(userId).select("+refreshtoken");
      // if (user) {
      //   user.refreshToken = null;
      //   await user.save();
      // }
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    HandleResponse(res, true, 200, "User logged out successfully");
  } catch (err) {
    next(err);
  }
}
export default {
  Signup,
  VerifyEmail,
  logout,
  Login,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyCode,
};
