import axios from "axios";

const API = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

export class RoomService {
  static async createRoom(roomCode, password, members = []) {
    const res = await API.post("/rooms/create", { roomCode, password, members });
    return res.data;
  }

  static async joinRoom(payload) {
    const res = await API.post("/rooms/join", payload);
    return res.data;
  }
}

export default RoomService;
