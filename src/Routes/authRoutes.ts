import express from "express";
import type { Router } from "express";
import auth from "../controllers/authController.ts";
import { profileDetails } from "../controllers/Profiledetailscontroller.ts";
import { verifyToken } from "../middlewares/verifyAccessToken.ts";
const authroute: Router = express.Router();

authroute.post("/signup", auth.Signup);
authroute.post("/login", auth.Login);
authroute.get("/verify-email", auth.VerifyEmail);
authroute.get("/refresh-token", auth.refreshToken);
authroute.post("/forgetpassword", auth.forgotPassword);
authroute.post("/verifycode", auth.verifyCode);
authroute.get("/me", verifyToken, profileDetails);
authroute.put("/resetpassword", auth.resetPassword);
authroute.get("/logout", auth.logout);
export default authroute;
