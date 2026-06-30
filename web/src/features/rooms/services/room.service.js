import { httpClient } from "../../../shared/api/http-client.js";

export class RoomService {
  static async createRoom({ roomCode, password, members = [] }) {
    const res = await httpClient.post("/rooms/create", { roomCode, password, members });
    return res.data.data;
  }

  static async getUniqueRoomCode() {
    const res = await httpClient.get("/rooms/code");
    return res.data.data;
  }

  static async joinRoom(payload) {
    const res = await httpClient.post("/rooms/join", payload);
    return res.data.data;
  }

  static async joinWithInvite(payload) {
    const res = await httpClient.post("/rooms/join-link", payload);
    return res.data.data;
  }

  static async getHistory() {
    const res = await httpClient.get("/rooms/history");
    return res.data.data;
  }

  static async closeRoom(roomCode) {
    const res = await httpClient.patch(`/rooms/${roomCode}/close`);
    return res.data.data;
  }
}

export default RoomService;
