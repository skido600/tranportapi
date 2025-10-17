import express from "express";
import { connectDb } from "./utils/Connectdb.ts";
import { port } from "./utils/dotenv.ts";
import { HandleError, notFound } from "./middlewares/ErrorHandling.ts";
import authroute from "./Routes/authRoutes.ts";
import cookieParser from "cookie-parser";
generateRandomCode();
import cors from "cors";
import driver from "./Routes/driverRoutes.ts";
import { generateRandomCode } from "./utils/UserId.ts";
import { initSocket } from "./utils/socket.ts";
import http from "http";
//  initSocket
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

server.use("/auth/v1", authroute);
server.use("/authenticated/v1", driver);
server.use(HandleError);
server.use(notFound);

const serverhttp = http.createServer(server);
initSocket(serverhttp);

serverhttp.listen(port, async () => {
  await connectDb();
  console.log("server running on port ", port);
});
