import { RoomRepository } from "./room.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { EnvConfig } from "../../config/env.js";

const ROOM_CODE_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;

class RoomService {
  constructor(roomRepository) {
    this.roomRepository = roomRepository || new RoomRepository();
  }

  async createRoom({ createdBy, roomCode, password, members = [] } = {}) {
    if (!createdBy) {
      throw new AppError("createdBy is required", 400);
    }
    if (!roomCode) {
      throw new AppError("roomCode is required", 400);
    }
    if (!password) {
      throw new AppError("password is required", 400);
    }

    if (!ROOM_CODE_REGEX.test(roomCode)) {
      throw new AppError("Invalid roomCode format", 400);
    }
    if (typeof password !== "string" || password.length < 4) {
      throw new AppError("Password must be at least 4 characters", 400);
    }

    const upperRoomCode = roomCode.toUpperCase();
    const existing = await this.roomRepository.findByCode(upperRoomCode);
    if (existing) {
      throw new AppError("Room code already exists", 409);
    }

    const room = await this.roomRepository.createRoom({
      roomCode: upperRoomCode,
      password,
      createdBy,
      members,
    });

    const joinLink = `${EnvConfig.get("FRONTEND_URL")}/join/${upperRoomCode}`;

    return {
      room,
      roomCode: upperRoomCode,
      password,
      joinLink,
    };
  }

  async joinRoom({ roomCode, password, userId } = {}) {
    if (!roomCode) {
      throw new AppError("roomCode is required", 400);
    }
    if (!password) {
      throw new AppError("password is required", 400);
    }
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const room = await this.roomRepository.findByCode(roomCode);
    if (!room) {
      throw new AppError("Room not found", 404);
    }

    if (room.password !== password) {
      throw new AppError("Invalid room password", 401);
    }

    const updated = await this.roomRepository.addMember(room._id, userId);

    return updated;
  }
}

export { RoomService };
export default RoomService;
