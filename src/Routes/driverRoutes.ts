import express from "express";
import type { Router } from "express";
import Drivercontoller, {
  getUserNotifications,
} from "../controllers/Drivercontoller.ts";
import upload from "../utils/multer.ts";
import { allowRoles, verifyToken } from "../middlewares/verifyAccessToken.ts";
import { isAdmin } from "../middlewares/isAdmin.ts";
import { getAllUsers } from "../controllers/Profiledetailscontroller.ts";
import {
  createDriverNews,
  getDriverNewsBySlug,
  GetEachDrivernews,
  deleteDriverNews,
} from "../controllers/Newscontroller.ts";
const driver: Router = express.Router();
driver.post(
  "/driver-request",
  verifyToken,
  allowRoles("driver"),
  upload.array("truckImagesDriver"),
  Drivercontoller.Drivercontroller
);
driver.get("/all_users", verifyToken, isAdmin, getAllUsers);
driver.post(
  "/accept/:driverid",
  verifyToken,
  isAdmin,
  Drivercontoller.AdminAcceptDriverRequest
);
driver.post(
  "/reject/:driverid",
  verifyToken,
  isAdmin,
  Drivercontoller.AdminRejectDriverRequest
);
driver.get(
  "/requestdetails",
  verifyToken,
  allowRoles("driver"),
  Drivercontoller.GeteachDriverRequest
);
driver.put(
  "/update",
  verifyToken,
  allowRoles("driver"),
  upload.array("truckImagesDriver"),
  Drivercontoller.UpdateDriverInfo
);
driver.delete(
  "/deleteimg/:imageId",
  verifyToken,
  allowRoles("driver"),
  Drivercontoller.DeleteDriverImage
);
driver.get(
  "/requested-driver",
  verifyToken,
  isAdmin,
  Drivercontoller.AdminGetAllRequestedDriver
);
//update dp
driver.get("/all_driver", Drivercontoller.Alldrivers);
driver.get("/all_driver/:id", Drivercontoller.getDriverById);

driver.post(
  "/news",
  verifyToken,
  allowRoles("driver"),
  upload.single("image"),
  createDriverNews
);
driver.get(
  "/news/:slug",
  verifyToken,
  allowRoles("driver"),

  getDriverNewsBySlug
);
driver.get("/myblogs", verifyToken, allowRoles("driver"), GetEachDrivernews);
driver.delete(
  "/myblogs/:id",
  verifyToken,
  allowRoles("driver"),

  deleteDriverNews
);
driver.get(
  "/notification",
  verifyToken,
  allowRoles("driver"),
  getUserNotifications
);
export default driver;
