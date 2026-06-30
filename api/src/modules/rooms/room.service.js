import { RoomRepository } from "./room.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { EnvConfig } from "../../config/env.js";
import { PasswordHashUtil } from "../../shared/utils/passwordHash.js";
import { RoomDTO } from "./room.dto.js";
import { RoomCodeUtil } from "../../shared/utils/roomCode.js";

const ROOM_CODE_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;

class RoomService {
  constructor(roomRepository) {
    this.roomRepository = roomRepository || new RoomRepository();
  }

  async createRoom({ createdBy, roomCode, password, members = [] } = {}) {
    if (!createdBy) {
      throw new AppError("createdBy is required", 400);
    }
    if (!password) {
      throw new AppError("password is required", 400);
    }

    if (roomCode && !ROOM_CODE_REGEX.test(roomCode)) {
      throw new AppError("Invalid roomCode format", 400);
    }
    if (typeof password !== "string" || password.length < 4) {
      throw new AppError("Password must be at least 4 characters", 400);
    }

    const upperRoomCode = await this.resolveRoomCode(roomCode);

    const hashedPassword = await PasswordHashUtil.hash(password);

    const room = await this.roomRepository.createRoom({
      roomCode: upperRoomCode,
      password: hashedPassword,
      createdBy,
      members: [...new Set([createdBy, ...members])],
    });

    const joinLink = `${EnvConfig.get("FRONTEND_URL")}/join/${upperRoomCode}`;

    return RoomDTO.withJoinLink(room, joinLink, createdBy);
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

    if (room.status === "closed") {
      throw new AppError("Room is closed", 403);
    }

    const isPasswordValid = await PasswordHashUtil.compare(password, room.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid room password", 401);
    }

    const updated = await this.roomRepository.addMember(room._id, userId);

    return RoomDTO.detail(updated, userId);
  }

  async joinRoomByInvite({ roomCode, userId } = {}) {
    if (!roomCode) {
      throw new AppError("roomCode is required", 400);
    }
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const room = await this.roomRepository.findByCode(roomCode.toUpperCase());
    if (!room) {
      throw new AppError("Room not found", 404);
    }

    if (room.status === "closed") {
      throw new AppError("Room is closed", 403);
    }

    const updated = await this.roomRepository.addMember(room._id, userId);

    return RoomDTO.detail(updated, userId);
  }

  async getHistory(userId) {
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const rooms = await this.roomRepository.findHistoryByUser(userId);

    return RoomDTO.history(
      rooms,
      userId,
      (roomCode) => `${EnvConfig.get("FRONTEND_URL")}/join/${roomCode}`,
    );
  }

  async generateAvailableRoomCode() {
    return this.resolveRoomCode();
  }

  async closeRoom({ roomCode, userId } = {}) {
    if (!roomCode) {
      throw new AppError("roomCode is required", 400);
    }
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const room = await this.roomRepository.findByCode(roomCode.toUpperCase());
    if (!room) {
      throw new AppError("Room not found", 404);
    }

    if (String(room.createdBy) !== String(userId)) {
      throw new AppError("Only the room host can close this room", 403);
    }

    const closedRoom = await this.roomRepository.closeRoom(room._id);
    return RoomDTO.detail(closedRoom, userId);
  }

  async resolveRoomCode(roomCode) {
    if (roomCode) {
      const upperRoomCode = roomCode.toUpperCase();
      const existing = await this.roomRepository.findByCode(upperRoomCode);

      if (existing) {
        throw new AppError("Room code already exists", 409);
      }

      return upperRoomCode;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const generatedRoomCode = RoomCodeUtil.generate();
      const existing = await this.roomRepository.findByCode(generatedRoomCode);

      if (!existing) {
        return generatedRoomCode;
      }
    }

    throw new AppError("Unable to generate a unique room code", 500);
  }
}

export { RoomService };
export default RoomService;
