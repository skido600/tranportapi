import express from "express";
import type { Router } from "express";
import Drivercontoller, {
  getUserNotifications,
} from "../controllers/Drivercontoller.ts";
import upload from "../utils/multer.ts";
import { verifyToken } from "../middlewares/verifyAccessToken.ts";
// import { isAdmin } from "../middlewares/isAdmin.ts";
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
  "/requestdetails",
  verifyToken,
  Drivercontoller.GeteachDriverRequest
);
driver.put(
  "/update",
  verifyToken,
  upload.array("truckImagesDriver"),
  Drivercontoller.UpdateDriverInfo
);
driver.delete(
  "/deleteimg/:imageId",
  verifyToken,
  Drivercontoller.DeleteDriverImage
);
driver.get(
  "/requested-driver",
  verifyToken,
  // isAdmin,
  Drivercontoller.AdminGetAllRequestedDriver
);
//update dp
// driver.put(
//   "/update-dp",
//   upload.single("image"),
//   verifyToken,
//   Drivercontoller.UpdateDp
// );

driver.post("/news", verifyToken, upload.single("image"), createDriverNews);
driver.get("/news/:slug", verifyToken, getDriverNewsBySlug);
driver.get("/myblogs", verifyToken, GetEachDrivernews);
driver.delete("/myblogs/:id", verifyToken, deleteDriverNews);
driver.get("/notification", verifyToken, getUserNotifications);
export default driver;
