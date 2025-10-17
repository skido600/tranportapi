import express from "express";
import type { Router } from "express";
import Drivercontoller, {
  getUserNotifications,
} from "../controllers/Drivercontoller.ts";
import upload from "../utils/multer.ts";
import { verifyToken } from "../middlewares/verifyAccessToken.ts";
import { isAdmin } from "../middlewares/isAdmin.ts";
import { getAllUsers } from "../controllers/Profiledetailscontroller.ts";
// getAllUsers
const driver: Router = express.Router();

driver.post(
  "/driver-request",
  verifyToken,
  upload.array("truckImagesDriver"),
  Drivercontoller.Drivercontroller
);
driver.get("/all_users", verifyToken, getAllUsers);
driver.post(
  "/accept/:driverid",
  verifyToken,
  Drivercontoller.AdminAcceptDriverRequest
);
driver.post(
  "/reject/:driverid",
  verifyToken,
  Drivercontoller.AdminRejectDriverRequest
);
driver.get(
  "/requested-driver",
  verifyToken,
  // isAdmin,
  Drivercontoller.AdminGetAllRequestedDriver
);

driver.get("/notification", verifyToken, getUserNotifications);
export default driver;
