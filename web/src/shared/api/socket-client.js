import { io } from "socket.io-client";
import { env } from "../utils/env.js";
import { tokenStorage } from "../utils/token-storage.js";

export const createSocketClient = () =>
  io(env.socketUrl, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: {
      token: tokenStorage.get(),
    },
  });
