import { io } from "socket.io-client";
import { env } from "../utils/env.js";

export const createSocketClient = (token) =>
  io(env.socketUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });
