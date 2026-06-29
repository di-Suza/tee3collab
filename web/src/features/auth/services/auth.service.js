import axios from "axios";
import { env } from "../../../shared/utils/env.js";

const API = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

const PENDING_JOIN_ROOM_KEY = "coderoom.pendingJoinRoomCode";

export class AuthService {
  static async getMe() {
    const res = await API.get("/auth/me");
    return res.data;
  }

  static googleAuthUrl() {
    return `${env.apiUrl}/auth/google`;
  }

  static setPendingJoinRoomCode(roomCode) {
    if (roomCode) {
      window.localStorage.setItem(PENDING_JOIN_ROOM_KEY, roomCode);
    }
  }

  static getPendingJoinRoomCode() {
    return window.localStorage.getItem(PENDING_JOIN_ROOM_KEY);
  }

  static clearPendingJoinRoomCode() {
    window.localStorage.removeItem(PENDING_JOIN_ROOM_KEY);
  }
}

export default AuthService;
