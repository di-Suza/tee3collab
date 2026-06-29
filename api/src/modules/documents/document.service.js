import { AppError } from "../../shared/errors/AppError.js";
import { DocumentDTO } from "./document.dto.js";
import { DocumentRepository } from "./document.repository.js";
import { SyncEngineService } from "./syncEngine.service.js";

class DocumentService {
  constructor(documentRepository, syncEngineService) {
    this.documentRepository = documentRepository || new DocumentRepository();
    this.syncEngineService = syncEngineService || new SyncEngineService();
  }

  async getSnapshot(roomCode) {
    const { document } = await this.documentRepository.findOrCreateByRoomCode(roomCode);

    if (!document) {
      throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    return DocumentDTO.snapshot(document);
  }

  async applyPatch(roomCode, patchPayload, actor) {
    if (!actor?.id) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { document } = await this.documentRepository.findOrCreateByRoomCode(roomCode);

    if (!document) {
      throw new AppError("Room not found", 404, "ROOM_NOT_FOUND");
    }

    const { patch, conflict } = this.syncEngineService.preparePatch(patchPayload, document);
    const nextContent = this.syncEngineService.applyPatch(document.content, patch);
    const savedDocument = await this.documentRepository.savePatch(
      document,
      nextContent,
      patch,
      actor.id,
    );

    return DocumentDTO.patchAccepted(savedDocument, {
      ...patch,
      version: savedDocument.version,
      conflict,
    });
  }
}

export { DocumentService };
export default DocumentService;
