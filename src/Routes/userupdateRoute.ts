import express from "express";
import type { Router } from "express";
import {
  getClientProfile,
  getDriverProfile,
  updateProfileImage,
  DeleteUserData,
} from "../controllers/Profiledetailscontroller.ts";
import upload from "../utils/multer.ts";
import { verifyToken } from "../middlewares/verifyAccessToken.ts";

const userpersonaldata: Router = express.Router();
userpersonaldata.get("/client", verifyToken, getClientProfile);
userpersonaldata.get("/driver", verifyToken, getDriverProfile);
userpersonaldata.delete("/delete", verifyToken, DeleteUserData);
userpersonaldata.put(
  "/update-dp",
  verifyToken,
  upload.single("profileImage"),
  updateProfileImage
);
export default userpersonaldata;
