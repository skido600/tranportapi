import Auth from "../models/usermodel.ts";
import argon2 from "argon2";
import {
  JWT_SEC,
  frontend_url,
  REFRESH_TOKEN_SECRET,
  HMAC_VERIFICATION_CODE_SECRET,
} from "../utils/dotenv.ts";
import { Tokens } from "../utils/TokenGenerate.ts";
import { MailService } from "../utils/sendEmails.ts";
import Otpcode from "../utils/genarateOtp.ts";
import { hmacProcess } from "../utils/hmacprocess.ts";
import client from "../utils/Redis.ts";

const tokenService = new Tokens();
// 30 minutes in milliseconds
const VERIFY_EXPIRES_IN = 30 * 60 * 1000;
const mailService = new MailService();
export const registerUser = async (
  full_name: string,
  email: string,
  userName: string,
  password: string,
  confirmPassword: string,
  country: string,
  address: string,
  role: string
) => {
  try {
    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
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
      country,
      verificationCodeExpires: new Date(Date.now() + VERIFY_EXPIRES_IN),
      address,
      role,
    });
    await newUser.save();
    const token = tokenService.generateMailToken(newUser._id, full_name);
    console.log(token);
    const verifyLink = `${frontend_url}/verify?token=${token}`;
    await mailService.sendVerification(newUser, verifyLink);
    return newUser;
  } catch (error) {
    throw error;
  }
};

export const verifyEmailService = async (token: string) => {
  try {
    if (!token) {
      throw new Error("Verification token is required");
    }
    const decodetoken = tokenService.decoded(token, JWT_SEC);
    console.log("token that is decoded", decodetoken);
    const user = await Auth.findById(decodetoken.userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (
      user.verificationCodeExpires &&
      user.verificationCodeExpires < new Date()
    ) {
      throw new Error(
        "Verification link has expired. Please request a new one. when you want to login"
      );
    }
    if (user.isVerified) {
      throw new Error("user already verified");
    }
    user.isVerified = true;
    user.verificationCodeExpires = null;
    await user.save();
    return "Email verified successfully!";
  } catch (error) {
    throw error;
  }
};

export const LoginService = async (
  Email_Username: string,
  password: string
) => {
  try {
    const normalizedInput = Email_Username.toLowerCase();
    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    }).select("+password");

    console.log("user", user);
    if (!user) {
      throw new Error("User not found");
    }
    const validPassword = await argon2.verify(user.password, password);
    if (!validPassword) {
      throw new Error("Incorrect password");
    }
    if (!user.isVerified) {
      const expired =
        !user.verificationCodeExpires ||
        user.verificationCodeExpires < new Date();

      if (expired) {
        const token = tokenService.generateMailToken(user._id, user.full_name);

        const verifyLink = `${frontend_url}/verify?token=${token}`;
        await mailService.sendVerification(user, verifyLink);

        user.verificationCodeExpires = new Date(Date.now() + VERIFY_EXPIRES_IN);
        await user.save();
        throw new Error(
          "Verification link expired. A new link has been sent to your email."
        );
      } else {
        throw new Error("Email not verified. Please check your inbox.");
      }
    }

    const accesstoken = tokenService.generateAccessToken(user);
    const refreshtoken = tokenService.generateRefreshToken(user);

    await client.set(`refresh:${user.id}`, refreshtoken, {
      EX: 60 * 60 * 24 * 7,
    });
    // user.refreshToken = refreshtoken;
    // await user.save();

    return { user, accesstoken, refreshtoken };
  } catch (error) {
    throw error;
  }
};

export async function refreshTokenVerify(token: string) {
  try {
    if (!token) {
      throw new Error("No refresh token provided");
    }

    const decoded = tokenService.decoded(token, REFRESH_TOKEN_SECRET) as {
      id: string;
      email: string;
    };

    // const user = await Auth.findById(decodedRefrshtoken.id).select(
    //   "+refreshToken"
    // );
    // console.log(user);
    // if (!user) {
    //   throw new Error("User not found");
    // }

    // if (user.refreshToken !== token) {
    //   throw new Error("Invalid refresh token");
    // }
    const storedToken = await client.get(`refresh:${decoded.id}`);
    console.log("redis", storedToken);
    if (!storedToken) {
      throw new Error("User not found or token expired");
    }

    if (storedToken !== token) {
      throw new Error("Invalid refresh token");
    }

    const user = await Auth.findById(decoded.id);
    if (!user) {
      throw new Error("User not found");
    }
    const newAccessToken = tokenService.generateAccessToken(user);
    return {
      newAccessToken: newAccessToken,
      message: "New access token issued",
    };
  } catch (error) {
    throw error;
  }
}

export async function forgotPasswordService(email: string) {
  try {
    const normalizedInput = email.toLowerCase();
    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    });
    if (!user) throw new Error("User not found invalid email or username");
    const verificationCode = Otpcode();
    const hashedCode = hmacProcess(
      verificationCode,
      HMAC_VERIFICATION_CODE_SECRET
    );
    user.resetCode = hashedCode;
    user.resetCodeExpire = new Date(Date.now() + 20 * 60 * 1000);
    await user.save();

    await mailService.sendOtp(user.email, verificationCode);

    return {
      email,
      message:
        "Password reset code sent to your email. the code will expire in the next 20mins",
    };
  } catch (error) {
    throw error;
  }
}

export async function verifyCodeService(email: any, code: any) {
  try {
    const normalizedInput = email.toLowerCase();

    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    });

    if (!user) {
      throw new Error("User not found");
    }

    const hashedCode = hmacProcess(code, HMAC_VERIFICATION_CODE_SECRET);
    if (
      hashedCode !== user.resetCode ||
      !user.resetCodeExpire ||
      Date.now() > user.resetCodeExpire.getTime()
    ) {
      throw new Error("Invalid or expired code");
    }
  } catch (error) {
    throw error;
  }
}

export async function resetPasswordService(
  email: string,
  code: string,
  newPassword: string,
  confirmNewpassword: string
) {
  try {
    if (newPassword !== confirmNewpassword) {
      throw new Error("Passwords do not match");
    }
    const normalizedInput = email.toLowerCase();
    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    }).select("+password");

    console.log(user);
    if (!user) {
      throw new Error("User not found");
    }
    const hashedCode = hmacProcess(code, HMAC_VERIFICATION_CODE_SECRET);
    if (
      hashedCode !== user.resetCode ||
      !user.resetCodeExpire ||
      Date.now() > user.resetCodeExpire.getTime()
    ) {
      throw new Error("Invalid or expired code");
    }

    const hashedPassword = await argon2.hash(newPassword);
    user.password = hashedPassword;
    user.resetCode = null;
    user.resetCodeExpire = null;
    await user.save();
  } catch (error) {
    throw error;
  }
}
