import type { Request, Response, NextFunction } from "express";
import { HandleResponse } from "../utils/Response.ts";
import type { SignupType, LoginType } from "../types/types.ts";
import {
  CreateUserSchema,
  Loginuser,
  ResetPassword,
  Firstemailvalidate,
  Verifycode,
} from "../validators/validation.ts";
import jwt from "jsonwebtoken";
import Auth from "../models/usermodel.ts";
import argon2 from "argon2";
import { sendverification, sendMailOtp } from "../utils/sendEmails.ts";

import {
  JWT_SEC,
  frontend_url,
  REFRESH_TOKEN_SECRET,
  HMAC_VERIFICATION_CODE_SECRET,
} from "../utils/dotenv.ts";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/TokenGenerate.ts";

import Otpcode from "../utils/genarateOtp.ts";
import { hmacProcess } from "../utils/hmacprocess.ts";
import Driver from "../models/DriverModel.ts";

// 30 minutes in milliseconds
const VERIFY_EXPIRES_IN = 30 * 60 * 1000;
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
    }: SignupType = req.body;
    const { error } = CreateUserSchema.validate({
      full_name,
      email,
      password,
      userName,
    });

    if (error) {
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }
    if (password !== confirmPassword) {
      return HandleResponse(res, false, 400, "Passwords do not match");
    }
    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      return HandleResponse(
        res,
        false,
        400,
        "User with this email already exists"
      );
    }
    const normalizedFullName = full_name.toLowerCase();
    const normalizedUserName = userName.toLowerCase();

    const hashedPassword = await argon2.hash(password);

    const newUser = new Auth({
      full_name: normalizedFullName,
      email,
      userName: normalizedUserName,
      password: hashedPassword,
      isVerified: false,
      verificationCodeExpires: new Date(Date.now() + VERIFY_EXPIRES_IN),
    });
    await newUser.save();
    const token = jwt.sign(
      {
        userid: newUser._id,
        full_name: newUser.full_name,
      },
      JWT_SEC,
      { expiresIn: "1h" }
    );
    const verifyLink = `${frontend_url}/verify?token=${token}`;
    await sendverification(newUser, verifyLink);

    HandleResponse(
      res,
      true,
      201,
      "User registered successfully. Check your email for verification.",
      token
    );
  } catch (error) {
    next(error);
  }
}
async function VerifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.query.token as string;

    if (!token) {
      return HandleResponse(res, false, 400, "Verification token is required");
    }

    const decoded: any = jwt.verify(token, JWT_SEC);
    console.log(decoded);
    const user = await Auth.findById(decoded.userid);
    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }

    if (
      user.verificationCodeExpires &&
      user.verificationCodeExpires < new Date()
    ) {
      return HandleResponse(
        res,
        false,
        400,
        "Verification link has expired. Please request a new one. when you want to login"
      );
    }
    if (user.isVerified) {
      return HandleResponse(res, false, 400, "user already verified");
    }
    user.isVerified = true;
    user.verificationCodeExpires = null;
    await user.save();
    HandleResponse(res, true, 200, "Email verified successfully!");
  } catch (error: any) {
    next(error);
  }
}
async function Login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { Email_Username, password }: LoginType = req.body;

    const { error } = Loginuser.validate({
      Email_Username,
      password,
    });

    if (error) {
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }
    const normalizedInput = Email_Username.toLowerCase();
    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    })
      .select("+password")
      .populate("driver");

    console.log(user);
    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }
    const validPassword = await argon2.verify(user.password, password);
    if (!validPassword) {
      return HandleResponse(res, false, 400, "Incorrect password");
    }
    if (!user.isVerified) {
      const expired =
        user.verificationCodeExpires &&
        user.verificationCodeExpires < new Date();

      const token = jwt.sign(
        {
          userid: user._id,
          full_name: user.full_name,
        },
        JWT_SEC,
        { expiresIn: "1h" }
      );

      const verifyLink = `${frontend_url}/verify?token=${token}`;
      await sendverification(user, verifyLink);

      user.verificationCodeExpires = new Date(Date.now() + VERIFY_EXPIRES_IN);
      await user.save();

      return HandleResponse(
        res,
        false,
        401,
        expired
          ? "Verification link expired. A new link has been sent to your email."
          : "Email not verified. A new verification link has been sent to your email."
      );
    }

    if (user.driver) {
      console.log("user from driver", user.driver);
      user.isDriverRequest = true;
      await user.save();
    }

    const accesstoken = generateAccessToken(user);
    const refreshtoken = generateRefreshToken(user);

    user.refreshToken = refreshtoken;
    await user.save();
    res.cookie("refreshToken", refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", accesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    HandleResponse(res, true, 200, "Login successful");
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return HandleResponse(res, false, 401, "No refresh token provided");
    }

    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as {
      id: string;
      email: string;
    };

    const user = await Auth.findById(decoded.id).select("+refreshToken");
    console.log(user);
    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }

    if (user.refreshToken !== token) {
      return HandleResponse(res, false, 403, "Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(user);
    console.log("newaccesstoken", newAccessToken);
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return HandleResponse(res, true, 200, "New access token issued");
  } catch (error: any) {
    next(error);
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

    const { error } = Firstemailvalidate.validate({
      email,
    });

    if (error) {
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }
    console.log(email);
    const normalizedInput = email.toLowerCase();
    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    });
    if (!user)
      return HandleResponse(
        res,
        false,
        404,
        "User not found invalid email or username"
      );

    const verificationCode = Otpcode();
    const hashedCode = hmacProcess(
      verificationCode,
      HMAC_VERIFICATION_CODE_SECRET
    );

    user.resetCode = hashedCode;
    user.resetCodeExpire = new Date(Date.now() + 20 * 60 * 1000);
    await user.save();

    await sendMailOtp(user.email, verificationCode);

    return HandleResponse(
      res,
      true,
      200,
      "Password reset code sent to your email. the code will expire in the next 20mins",
      { email }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      next(error);
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

    const { error } = Verifycode.validate({
      email,
      code,
    });

    if (error) {
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }
    const normalizedInput = email.toLowerCase();

    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    });

    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }

    const hashedCode = hmacProcess(code, HMAC_VERIFICATION_CODE_SECRET);
    if (
      hashedCode !== user.resetCode ||
      !user.resetCodeExpire ||
      Date.now() > user.resetCodeExpire.getTime()
    ) {
      return HandleResponse(res, false, 400, "Invalid or expired code");
    }
    return HandleResponse(res, true, 200, "Code verified sucessfully");
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code, newPassword, confirmNewpassword } = req.body;
    const { error } = ResetPassword.validate({
      email,
      code,
      newPassword,
      confirmNewpassword,
    });

    if (error) {
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }
    if (newPassword !== confirmNewpassword) {
      return HandleResponse(res, false, 400, "Passwords do not match");
    }
    const normalizedInput = email.toLowerCase();
    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    }).select("+password");

    console.log(user);
    if (!user) {
      return HandleResponse(res, false, 404, "User not found");
    }
    const hashedCode = hmacProcess(code, HMAC_VERIFICATION_CODE_SECRET);
    if (
      hashedCode !== user.resetCode ||
      !user.resetCodeExpire ||
      Date.now() > user.resetCodeExpire.getTime()
    ) {
      return HandleResponse(res, false, 400, "Invalid or expired code");
    }

    const hashedPassword = await argon2.hash(newPassword);
    user.password = hashedPassword;
    user.resetCode = null;
    user.resetCodeExpire = null;
    await user.save();
    return HandleResponse(res, true, 200, "Password reset successful");
  } catch (error) {
    next(error);
  }
};

export function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (!res.clearCookie) {
      throw new Error("res is not an Express Response object");
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

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
