import express from "express";
import { connectDb } from "./utils/Connectdb.ts";
import { port } from "./utils/dotenv.ts";
import { HandleError, notFound } from "./middlewares/ErrorHandling.ts";
import authroute from "./Routes/authRoutes.ts";
import cookieParser from "cookie-parser";

import cors from "cors";
import driver from "./Routes/driverRoutes.ts";

import { initSocket } from "./utils/socket.ts";
import path from "path";
import http from "http";
import userpersonaldata from "./Routes/userupdateRoute.ts";

//  initSocket
const server = express();
//middleware
server.use(express.json());
server.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://tranport.vercel.app",
      "tranport-production.up.railway.app",
    ],
    credentials: true,
  })
);
server.use(cookieParser());
server.use(express.urlencoded({ extended: true }));
server.use(
  "/images",
  express.static(path.join(process.cwd(), "/public/images"))
);

server.use("/auth/v1", authroute);
server.use("/authenticated/v1", driver);
server.use("/authenticated/userdetails", userpersonaldata);
server.use(HandleError);
server.use(notFound);

const serverhttp = http.createServer(server);
initSocket(serverhttp);
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Optionally exit:
  process.exit(1);
});
serverhttp.listen(port, async () => {
  await connectDb();
  console.log("server running on port ", port);
});
