import express from "express";
import type { Router } from "express";
import auth from "../controllers/authController.ts";
import {
  getClientProfile,
  getDriverProfile,
} from "../controllers/Profiledetailscontroller.ts";
import { verifyToken } from "../middlewares/verifyAccessToken.ts";
import validateRequest from "../middlewares/ValidateRequest.ts";
import {
  CreateUserSchema,
  Loginuser,
  ResetPassword,
  Firstemailvalidate,
  Verifycode,
} from "../validators/validation.ts";

const authroute: Router = express.Router();

authroute.post("/signup", validateRequest(CreateUserSchema), auth.Signup);
authroute.post("/login", validateRequest(Loginuser), auth.Login);
authroute.get("/verify-email", auth.VerifyEmail);
authroute.get("/refresh-token", auth.refreshToken);
authroute.post(
  "/forgetpassword",
  validateRequest(Firstemailvalidate),
  auth.forgotPassword
);
authroute.post("/verifycode", validateRequest(Verifycode), auth.verifyCode);
// authroute.get("/client", verifyToken, getClientProfile);
// authroute.get("/driver", verifyToken, getDriverProfile);
authroute.put(
  "/resetpassword",
  validateRequest(ResetPassword),
  auth.resetPassword
);
authroute.get("/logout", auth.logout);
export default authroute;
