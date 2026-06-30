import { SOCKET_EVENTS } from "../../shared/constants/socketEvents.js";
import { DocumentService } from "../../modules/documents/document.service.js";

class DocumentSocketHandler {
  constructor(io, socket) {
    this.io = io;
    this.socket = socket;
    this.documentService = new DocumentService();
  }

  register() {
    this.socket.on(SOCKET_EVENTS.DOCUMENT_JOIN, this.handleJoin.bind(this));
    this.socket.on(SOCKET_EVENTS.DOCUMENT_PATCH, this.handlePatch.bind(this));
    this.socket.on(SOCKET_EVENTS.PRESENCE_TYPING_START, this.handleTypingStart.bind(this));
    this.socket.on(SOCKET_EVENTS.PRESENCE_TYPING_STOP, this.handleTypingStop.bind(this));
  }

  async handleJoin({ roomCode } = {}, acknowledge) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      const snapshot = await this.documentService.getSnapshot(
        normalizedRoomCode,
        this.socket.user,
      );

      this.socket.join(normalizedRoomCode);
      this.socket.emit(SOCKET_EVENTS.DOCUMENT_SNAPSHOT, snapshot);

      if (typeof acknowledge === "function") {
        acknowledge({ ok: true, data: snapshot });
      }
    } catch (error) {
      this.emitError(error, acknowledge);
    }
  }

  async handlePatch({ roomCode, patch } = {}, acknowledge) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      const result = await this.documentService.applyPatch(
        normalizedRoomCode,
        patch,
        this.socket.user,
      );

      const payload = {
        ...result,
        actor: this.getActorPayload(),
      };

      this.socket.to(normalizedRoomCode).emit(SOCKET_EVENTS.DOCUMENT_PATCH_APPLIED, payload);

      if (typeof acknowledge === "function") {
        acknowledge({ ok: true, data: payload });
      }
    } catch (error) {
      this.emitError(error, acknowledge);
    }
  }

  handleTypingStart({ roomCode, lineNumber } = {}) {
    this.emitTyping(roomCode, true, { lineNumber });
  }

  handleTypingStop({ roomCode } = {}) {
    this.emitTyping(roomCode, false);
  }

  emitTyping(roomCode, isTyping, meta = {}) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);

      this.socket.to(normalizedRoomCode).emit(SOCKET_EVENTS.DOCUMENT_TYPING, {
        roomCode: normalizedRoomCode,
        isTyping,
        lineNumber: meta.lineNumber || null,
        actor: this.getActorPayload(),
      });
    } catch (error) {
      this.socket.emit(SOCKET_EVENTS.DOCUMENT_SYNC_ERROR, {
        message: error.message,
        code: error.code || "DOCUMENT_SYNC_ERROR",
      });
    }
  }

  getActorPayload() {
    return {
      id: this.socket.user.id,
      name: this.socket.user.name,
      picture: this.socket.user.picture,
    };
  }

  normalizeRoomCode(roomCode) {
    const normalizedRoomCode = String(roomCode || "").toUpperCase();

    if (!normalizedRoomCode) {
      throw new Error("roomCode is required");
    }

    return normalizedRoomCode;
  }

  emitError(error, acknowledge) {
    const payload = {
      message: error.message,
      code: error.code || "DOCUMENT_SYNC_ERROR",
    };

    this.socket.emit(SOCKET_EVENTS.DOCUMENT_SYNC_ERROR, payload);

    if (typeof acknowledge === "function") {
      acknowledge({ ok: false, error: payload });
    }
  }
}

export { DocumentSocketHandler };
export default DocumentSocketHandler;
