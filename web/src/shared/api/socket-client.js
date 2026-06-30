import { io } from "socket.io-client";
import { env } from "../utils/env.js";

export const createSocketClient = () =>
  io(env.socketUrl, {
    transports: ["websocket", "polling"],
    withCredentials: true,
  });
