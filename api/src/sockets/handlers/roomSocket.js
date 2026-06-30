import { PresenceService } from "../../modules/presence/presence.service.js";
import { SOCKET_EVENTS } from "../../shared/constants/socketEvents.js";

class RoomSocketHandler {
  constructor(io, socket) {
    this.io = io;
    this.socket = socket;
    this.presenceService = new PresenceService();
  }

  register() {
    this.socket.on(SOCKET_EVENTS.ROOM_JOIN, this.handleJoin.bind(this));
    this.socket.on(SOCKET_EVENTS.ROOM_LEAVE, this.handleLeave.bind(this));
    this.socket.on("disconnect", this.handleDisconnect.bind(this));
  }

  async handleJoin({ roomCode } = {}, acknowledge) {
    try {
      const payload = await this.presenceService.joinRoom({
        roomCode,
        socketId: this.socket.id,
        actor: this.socket.user,
      });

      this.socket.join(payload.roomCode);
      this.io.to(payload.roomCode).emit(SOCKET_EVENTS.ROOM_PARTICIPANTS, payload);

      if (typeof acknowledge === "function") {
        acknowledge({ ok: true, data: payload });
      }
    } catch (error) {
      this.emitError(error, acknowledge);
    }
  }

  handleLeave({ roomCode } = {}, acknowledge) {
    try {
      const payload = this.presenceService.leaveRoom({
        roomCode,
        socketId: this.socket.id,
      });

      this.io.to(payload.roomCode).emit(SOCKET_EVENTS.ROOM_PARTICIPANTS, payload);
      this.socket.leave(payload.roomCode);

      if (typeof acknowledge === "function") {
        acknowledge({ ok: true, data: payload });
      }
    } catch (error) {
      this.emitError(error, acknowledge);
    }
  }

  handleDisconnect() {
    for (const { roomCode, snapshot } of this.presenceService.leaveAll(this.socket.id)) {
      this.io.to(roomCode).emit(SOCKET_EVENTS.ROOM_PARTICIPANTS, snapshot);
    }
  }

  emitError(error, acknowledge) {
    const payload = {
      message: error.message,
      code: error.code || "ROOM_SYNC_ERROR",
    };

    this.socket.emit(SOCKET_EVENTS.ROOM_SYNC_ERROR, payload);

    if (typeof acknowledge === "function") {
      acknowledge({ ok: false, error: payload });
    }
  }
}

export { RoomSocketHandler };
export default RoomSocketHandler;
