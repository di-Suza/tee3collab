import { AppError } from "../../shared/errors/AppError.js";
import { DocumentDTO } from "./document.dto.js";
import { DocumentRepository } from "./document.repository.js";
import { SyncEngineService } from "./syncEngine.service.js";

class DocumentService {
  constructor(documentRepository, syncEngineService) {
    this.documentRepository = documentRepository || new DocumentRepository();
    this.syncEngineService = syncEngineService || new SyncEngineService();
  }

  async getSnapshot(roomCode, actor) {
    if (!actor?.id) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { room, document } = await this.documentRepository.findOrCreateByRoomCode(roomCode);

    if (!document) {
      throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    this.assertRoomAccess(room, actor);

    return DocumentDTO.snapshot(document);
  }

  async applyPatch(roomCode, patchPayload, actor) {
    if (!actor?.id) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { room, document } = await this.documentRepository.findOrCreateByRoomCode(roomCode);

    if (!document) {
      throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    this.assertRoomAccess(room, actor);

    const { patch, conflict } = this.syncEngineService.preparePatch(patchPayload, document);
    const nextContent = this.syncEngineService.applyPatch(document.content, patch);
    const savedDocument = await this.documentRepository.savePatch(
      document,
      nextContent,
      patch,
      actor,
      conflict,
    );

    return DocumentDTO.patchAccepted(savedDocument, {
      ...patch,
      version: savedDocument.version,
      conflict,
    });
  }

  assertRoomAccess(room, actor) {
    if (!room) {
      throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    if (room.status === "closed") {
      throw new AppError("Room is closed", 403, "ROOM_CLOSED");
    }

    const actorId = String(actor.id);
    const isHost = String(room.createdBy) === actorId;
    const isMember = (room.members || []).some((member) => String(member) === actorId);

    if (!isHost && !isMember) {
      throw new AppError("Join the room before editing its document", 403, "ROOM_ACCESS_DENIED");
    }
  }
}

export { DocumentService };
export default DocumentService;
