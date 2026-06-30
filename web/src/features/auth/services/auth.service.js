import { env } from "../../../shared/utils/env.js";
import { httpClient } from "../../../shared/api/http-client.js";

const PENDING_JOIN_ROOM_KEY = "coderoom.pendingJoinRoomCode";

export class AuthService {
  static async getMe() {
    const res = await httpClient.get("/auth/me");
    return res.data;
  }

  static async updateMe(profile) {
    const res = await httpClient.patch("/auth/me", profile);
    return res.data;
  }

  static async logout() {
    await httpClient.post("/auth/logout");
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
