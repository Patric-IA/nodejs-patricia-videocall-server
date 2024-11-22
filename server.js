import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "node:http";
import onCall from "./socket-events/onCall.js";
import onWebrtcSignal from "./socket-events/onWebrtcSignal.js";
import onHangup from "./socket-events/onHangup.js";
import cors from "cors";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());

const server = createServer(app);
export let io = new Server(server, {
  cors: {
    origin: "*", // Cambia '*' por el origen correcto si no es abierto
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let onlineUsers = [];

io.on("connection", (socket) => {
  socket.on("addNewUser", (supabaseUser) => {
    if (
      supabaseUser &&
      !onlineUsers.some((user) => user?.userId === supabaseUser.uuid)
    ) {
      onlineUsers.push({
        userId: supabaseUser.uuid,
        socketId: socket.id,
        profile: supabaseUser.full_name,
        imageUrl: supabaseUser?.imageUrl,
        is_top: supabaseUser?.is_top,
        nivel_ingles: supabaseUser?.nivel_ingles,
        bio: supabaseUser?.bio,
        estrellas: supabaseUser?.estrellas,
        porcentaje: supabaseUser?.porcentaje,
        flag: supabaseUser?.flag,
      });
    }
    // send active users
    io.emit("getUsers", onlineUsers);
    //mensaje:
    console.log("onlineUsers- ServerSite", onlineUsers);
  });

  console.log("connected-SERVERsiteSCOKETID", socket.id);
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    // send active users
    io.emit("getUsers", onlineUsers);
  });
  // other events
  socket.on("call", onCall);
  socket.on("webrtcSignal", onWebrtcSignal);
  socket.on("hangup", onHangup);
});

app.use(logger("dev"));

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
