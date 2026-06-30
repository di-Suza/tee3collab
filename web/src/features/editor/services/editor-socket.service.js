import { createSocketClient } from "../../../shared/api/socket-client.js";

export class EditorSocketService {
  constructor() {
    this.socket = createSocketClient();
  }

  joinDocument(roomCode, acknowledge) {
    this.socket.emit("document:join", { roomCode }, acknowledge);
  }

  sendPatch(roomCode, patch, acknowledge) {
    this.socket.emit("document:patch", { roomCode, patch }, acknowledge);
  }

  startTyping(roomCode, meta = {}) {
    this.socket.emit("presence:typing:start", { roomCode, ...meta });
  }

  stopTyping(roomCode) {
    this.socket.emit("presence:typing:stop", { roomCode });
  }

  onSnapshot(handler) {
    this.socket.on("document:snapshot", handler);
  }

  onPatchApplied(handler) {
    this.socket.on("document:patch:applied", handler);
  }

  onTyping(handler) {
    this.socket.on("document:typing", handler);
  }

  onSyncError(handler) {
    this.socket.on("document:sync:error", handler);
  }

  onConnectionChange(handler) {
    this.socket.on("connect", () => handler(true));
    this.socket.on("disconnect", () => handler(false));
  }

  disconnect() {
    this.socket.disconnect();
  }
}
