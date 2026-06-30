import { httpClient } from "../../../shared/api/http-client.js";

export class RoomService {
  static async createRoom({ roomCode, password, members = [], name, description }) {
    const res = await httpClient.post("/rooms/create", {
      roomCode,
      password,
      members,
      name,
      description,
    });
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

  static async getRoom(roomCode) {
    const res = await httpClient.get(`/rooms/${roomCode}`);
    return res.data.data;
  }

  static async updateRoom(roomCode, payload) {
    const res = await httpClient.patch(`/rooms/${roomCode}`, payload);
    return res.data.data;
  }

  static async deleteRoom(roomCode) {
    const res = await httpClient.delete(`/rooms/${roomCode}`);
    return res.data.data;
  }

  static async removeMember(roomCode, memberId) {
    const res = await httpClient.delete(`/rooms/${roomCode}/members/${memberId}`);
    return res.data.data;
  }

  static async leaveRoom(roomCode) {
    const res = await httpClient.post(`/rooms/${roomCode}/leave`);
    return res.data.data;
  }

  static async closeRoom(roomCode) {
    const res = await httpClient.patch(`/rooms/${roomCode}/close`);
    return res.data.data;
  }
}

export default RoomService;
