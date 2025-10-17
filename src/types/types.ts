import { Response } from "express";
import mongoose from "mongoose";
export type HandleResponseType<> = (
  res: Response,
  success: boolean,
  statuscode: number,
  message: string | any[],
  data?: unknown
) => void;

export interface Driver extends mongoose.Document {
  authId: mongoose.Types.ObjectId;
  driverId: string;
  discountPrice: number;
  licenseNumber: string;
  isDriver: boolean;
  phone: string;
  truckType: string;
  country: string;
  state: string;
  town: string;
  price: number;
  isDriverRequest: boolean;
  verified: boolean;
  rating: number;
  images: any;
  description: string;
  status: "pending" | "approved" | "rejected" | "none";
  experience: number;
  truckImagesDriver?: mongoose.Types.ObjectId | null;
}
export interface AuthUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  full_name: string;
  email: string;
  password: string;
  userId: string;
  userName: string;
  refreshToken: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  image: string;
  publicId: string;
  address: string | null;
  role: string;
  country: string | null;
  isDriver: boolean;
  driver?: mongoose.Types.ObjectId | any;
  isDriverRequest: boolean;
  ispremium: boolean;

  resetCode?: string | null;
  resetCodeExpire?: Date | null;
  verificationCode?: string | null;
  verificationCodeExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export type SignupType = {
  full_name: string;
  email: string;
  userName: string;
  password: string;
  confirmPassword: string;
  address: string;
  Phone_Number: number;
  country: string;
  role: string;
  // location?: {
  //   latitude: number;
  //   longitude: number;
  // };
};
export type LoginType = {
  Email_Username: string;
  password: string;
};
