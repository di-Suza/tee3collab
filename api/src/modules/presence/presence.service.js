import { AppError } from "../../shared/errors/AppError.js";
import { RoomRepository } from "../rooms/room.repository.js";
import { PresenceDTO } from "./presence.dto.js";

class PresenceService {
  static rooms = new Map();

  constructor(roomRepository) {
    this.roomRepository = roomRepository || new RoomRepository();
  }

  async joinRoom({ roomCode, socketId, actor } = {}) {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const room = await this.roomRepository.findByCodeWithMembers(normalizedRoomCode);

    this.assertCanJoin(room, actor);

    const roomPresence = this.getRoomPresence(normalizedRoomCode);
    this.syncRoomMembers(roomPresence, room);
    this.markOnline(roomPresence, actor, socketId);

    return this.snapshot(normalizedRoomCode);
  }

  leaveRoom({ roomCode, socketId } = {}) {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const roomPresence = PresenceService.rooms.get(normalizedRoomCode);

    if (!roomPresence) {
      return PresenceDTO.room(normalizedRoomCode, []);
    }

    this.markSocketOffline(roomPresence, socketId);
    return this.snapshot(normalizedRoomCode);
  }

  leaveAll(socketId) {
    const changedRooms = [];

    for (const [roomCode, roomPresence] of PresenceService.rooms.entries()) {
      const changed = this.markSocketOffline(roomPresence, socketId);

      if (changed) {
        changedRooms.push({
          roomCode,
          snapshot: this.snapshot(roomCode),
        });
      }
    }

    return changedRooms;
  }

  snapshot(roomCode) {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const roomPresence = PresenceService.rooms.get(normalizedRoomCode);

    if (!roomPresence) {
      return PresenceDTO.room(normalizedRoomCode, []);
    }

    const participants = Array.from(roomPresence.participants.values())
      .map((entry) => PresenceDTO.participant(entry))
      .sort((first, second) => {
        if (first.status !== second.status) {
          return first.status === "online" ? -1 : 1;
        }

        if (first.role !== second.role) {
          return first.role === "host" ? -1 : 1;
        }

        return first.name.localeCompare(second.name);
      });

    return PresenceDTO.room(normalizedRoomCode, participants);
  }

  syncRoomMembers(roomPresence, room) {
    const host = PresenceDTO.actor(room.createdBy, "host");
    this.ensureParticipant(roomPresence, host);

    for (const member of room.members || []) {
      const role = String(member?._id || member?.id || member) === host.id ? "host" : "member";
      this.ensureParticipant(roomPresence, PresenceDTO.actor(member, role));
    }
  }

  markOnline(roomPresence, actor, socketId) {
    if (!socketId) {
      throw new AppError("socketId is required", 400, "SOCKET_ID_REQUIRED");
    }

    const user = PresenceDTO.actor(actor, "member");
    const entry = this.ensureParticipant(roomPresence, user);
    const now = new Date().toISOString();

    entry.user = {
      ...entry.user,
      name: user.name,
      email: user.email,
      picture: user.picture,
    };
    entry.sockets.set(socketId, { connectedAt: now });
    entry.joinedAt = entry.joinedAt || now;
    entry.lastSeenAt = now;
  }

  markSocketOffline(roomPresence, socketId) {
    if (!socketId) {
      return false;
    }

    let changed = false;
    const now = new Date().toISOString();

    for (const entry of roomPresence.participants.values()) {
      if (entry.sockets.delete(socketId)) {
        entry.lastSeenAt = now;
        changed = true;
      }
    }

    return changed;
  }

  ensureParticipant(roomPresence, user) {
    const existing = roomPresence.participants.get(user.id);

    if (existing) {
      const role = existing.user.role === "host" ? "host" : user.role;
      existing.user = { ...existing.user, ...user, role };
      return existing;
    }

    const entry = {
      user,
      sockets: new Map(),
      joinedAt: null,
      lastSeenAt: null,
    };

    roomPresence.participants.set(user.id, entry);
    return entry;
  }

  getRoomPresence(roomCode) {
    if (!PresenceService.rooms.has(roomCode)) {
      PresenceService.rooms.set(roomCode, {
        participants: new Map(),
      });
    }

    return PresenceService.rooms.get(roomCode);
  }

  assertCanJoin(room, actor) {
    if (!actor?.id) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!room) {
      throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    if (room.status === "closed") {
      throw new AppError("Room is closed", 403, "ROOM_CLOSED");
    }

    const actorId = String(actor.id);
    const createdById = String(room.createdBy?._id || room.createdBy);
    const memberIds = (room.members || []).map((member) =>
      String(member?._id || member?.id || member),
    );

    if (actorId !== createdById && !memberIds.includes(actorId)) {
      throw new AppError("Join the room before opening presence", 403, "ROOM_ACCESS_DENIED");
    }
  }

  normalizeRoomCode(roomCode) {
    const normalizedRoomCode = String(roomCode || "").trim().toUpperCase();

    if (!normalizedRoomCode) {
      throw new AppError("roomCode is required", 400, "ROOM_CODE_REQUIRED");
    }

    return normalizedRoomCode;
  }
}

export { PresenceService };
export default PresenceService;
