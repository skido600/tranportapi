// socket.ts
import { Server } from "socket.io";
let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "https://tranport.vercel.app"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // when user connects, attach their ID
    socket.on("register", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
      socket.join(userId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
