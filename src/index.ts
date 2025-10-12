import express from "express";
import { connectDb } from "./utils/Connectdb.ts";
import { port } from "./utils/dotenv.ts";
import { HandleError, notFound } from "./middlewares/ErrorHandling.ts";
import authroute from "./Routes/authRoutes.ts";
import cookieParser from "cookie-parser";

import cors from "cors";
import driver from "./Routes/driverRoutes.ts";
const server = express();
//middleware
server.use(express.json());
server.use(
  cors({
    origin: ["http://localhost:3000", "https://tranport.vercel.app"],
    credentials: true,
  })
);
server.use(cookieParser());
// server.use((req: any, res: any, next) => {
//   console.log("🔹 Cookies received:", req.cookies);
//   next();
// });

//routes
server.use("/auth/v1", authroute);
server.use("/authenticated/v1", driver);
server.use(HandleError);
server.use(notFound);
server.listen(port, async () => {
  await connectDb();
  console.log("server running on port ", port);
});
