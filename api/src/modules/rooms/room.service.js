import { RoomRepository } from "./room.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { EnvConfig } from "../../config/env.js";
import { PasswordHashUtil } from "../../shared/utils/passwordHash.js";
import { RoomDTO } from "./room.dto.js";
import { RoomCodeUtil } from "../../shared/utils/roomCode.js";
import { DocumentRepository } from "../documents/document.repository.js";

const ROOM_CODE_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;

class RoomService {
  constructor(roomRepository, documentRepository) {
    this.roomRepository = roomRepository || new RoomRepository();
    this.documentRepository = documentRepository || new DocumentRepository();
  }

  async createRoom({ createdBy, roomCode, password, members = [], name, description } = {}) {
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
      name: this.normalizeRoomName(name),
      description: this.normalizeRoomDescription(description),
      roomCode: upperRoomCode,
      password: hashedPassword,
      createdBy,
      members: [...new Set([createdBy, ...members])],
    });

    const joinLink = `${EnvConfig.get("FRONTEND_URL")}/join/${upperRoomCode}`;

    return RoomDTO.withJoinLink(room, joinLink, createdBy);
  }

  async getRoomDetail({ roomCode, userId } = {}) {
    if (!roomCode) {
      throw new AppError("roomCode is required", 400);
    }
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const room = await this.roomRepository.findByCodeWithMembers(roomCode.toUpperCase());
    if (!room) {
      throw new AppError("Room not found", 404);
    }

    this.assertRoomAccess(room, userId);
    return RoomDTO.detail(room, userId);
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

  async updateRoom({ roomCode, userId, name, description, password } = {}) {
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

    this.assertHost(room, userId);

    const updates = {};

    if (name !== undefined) {
      updates.name = this.normalizeRoomName(name);
    }

    if (description !== undefined) {
      updates.description = this.normalizeRoomDescription(description);
    }

    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 4) {
        throw new AppError("Password must be at least 4 characters", 400);
      }

      updates.password = await PasswordHashUtil.hash(password);
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("No room updates provided", 400);
    }

    const updatedRoom = await this.roomRepository.updateRoom(room._id, updates);
    return RoomDTO.detail(updatedRoom, userId);
  }

  async deleteRoom({ roomCode, userId } = {}) {
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

    this.assertHost(room, userId);

    await this.documentRepository.deleteByRoomCode(room.roomCode);
    const deletedRoom = await this.roomRepository.deleteRoom(room._id);

    return RoomDTO.detail(deletedRoom, userId);
  }

  async removeMember({ roomCode, userId, memberId } = {}) {
    if (!roomCode) {
      throw new AppError("roomCode is required", 400);
    }
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    if (!memberId) {
      throw new AppError("memberId is required", 400);
    }

    const room = await this.roomRepository.findByCode(roomCode.toUpperCase());
    if (!room) {
      throw new AppError("Room not found", 404);
    }

    this.assertHost(room, userId);

    if (String(room.createdBy) === String(memberId)) {
      throw new AppError("Host cannot be removed from the room", 400);
    }

    if (!this.isRoomMember(room, memberId)) {
      throw new AppError("User is not a member of this room", 404);
    }

    const updatedRoom = await this.roomRepository.removeMember(room._id, memberId);
    return RoomDTO.detail(updatedRoom, userId);
  }

  async leaveRoom({ roomCode, userId } = {}) {
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

    if (String(room.createdBy) === String(userId)) {
      throw new AppError("Host cannot leave an owned room. Delete the room instead.", 400);
    }

    if (!this.isRoomMember(room, userId)) {
      throw new AppError("User is not a member of this room", 404);
    }

    const updatedRoom = await this.roomRepository.removeMember(room._id, userId);
    return RoomDTO.detail(updatedRoom, userId);
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

  assertHost(room, userId) {
    if (String(room.createdBy?._id || room.createdBy) !== String(userId)) {
      throw new AppError("Only the room host can perform this action", 403);
    }
  }

  assertRoomAccess(room, userId) {
    if (room.status === "closed") {
      throw new AppError("Room is closed", 403);
    }

    const isHost = String(room.createdBy?._id || room.createdBy) === String(userId);

    if (!isHost && !this.isRoomMember(room, userId)) {
      throw new AppError("Join the room before accessing it", 403);
    }
  }

  isRoomMember(room, userId) {
    return (room.members || []).some((member) =>
      String(member?._id || member?.id || member) === String(userId),
    );
  }

  normalizeRoomName(name) {
    const normalized = String(name || "").trim();
    return normalized || "Untitled Room";
  }

  normalizeRoomDescription(description) {
    return String(description || "").trim();
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
