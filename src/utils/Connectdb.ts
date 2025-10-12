import mongoose from "mongoose";
import { mongodburl } from "./dotenv.ts";

const connectDb = async (): Promise<void> => {
  try {
    const connect = await mongoose.connect(mongodburl as string);
    console.log(`MongoDB connected successfully ${connect.connection.name}`);
  } catch (error) {
    console.error(" MongoDB connection failed", error);
  }
};

export { connectDb };
