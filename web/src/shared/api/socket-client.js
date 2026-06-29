import { io } from "socket.io-client";
import { env } from "../utils/env.js";

export const createSocketClient = (token = null) =>
  io(env.socketUrl, {
    auth: token ? { token } : {},
    transports: ["websocket", "polling"],
    withCredentials: true,
  });
