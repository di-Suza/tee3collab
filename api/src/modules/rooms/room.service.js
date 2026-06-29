import crypto from "crypto";
import { RoomRepository } from "./room.repository.js";
import { RoomCodeUtil } from "../../shared/utils/roomCode.js";
import { AppError } from "../../shared/errors/AppError.js";
import { EnvConfig } from "../../config/env.js";

class RoomService {
  constructor(roomRepository) {
    this.roomRepository = roomRepository || new RoomRepository();
  }

  async createRoom({ createdBy, members = [] } = {}) {
    if (!createdBy) {
      throw new AppError("createdBy is required", 400);
    }

    // Generate unique room code
    let roomCode = RoomCodeUtil.generate();
    let exists = await this.roomRepository.findByCode(roomCode);
    let attempts = 0;
    while (exists && attempts < 5) {
      roomCode = RoomCodeUtil.generate();
      exists = await this.roomRepository.findByCode(roomCode);
      attempts += 1;
    }
    if (exists) {
      throw new AppError("Failed to generate unique room code", 500);
    }

    // Simple password generation
    const password = crypto.randomBytes(4).toString("hex");

    const room = await this.roomRepository.createRoom({
      roomCode,
      password,
      createdBy,
      members,
    });

    const joinLink = `${EnvConfig.get("FRONTEND_URL")}/rooms/join/${roomCode}`;

    return {
      room,
      roomCode,
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
