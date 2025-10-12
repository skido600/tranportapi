import express from "express";
import type { Router } from "express";
import Drivercontoller from "../controllers/Drivercontoller.ts";
import upload from "../utils/multer.ts";
import { verifyToken } from "../middlewares/verifyAccessToken.ts";
import { isAdmin } from "../middlewares/isAdmin.ts";

const driver: Router = express.Router();

driver.post(
  "/driver-request",
  verifyToken,
  upload.array("truckImagesDriver"),
  Drivercontoller.Drivercontroller
);

driver.get(
  "/requested-driver",
  verifyToken,
  // isAdmin,
  Drivercontoller.AdminGetAllRequestedDriver
);
export default driver;
