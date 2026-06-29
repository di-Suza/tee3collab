import { AppError } from "../../shared/errors/AppError.js";
import { PatchUtil } from "../../shared/utils/patch.js";
import { DocumentDTO } from "./document.dto.js";
import { DocumentRepository } from "./document.repository.js";

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository || new DocumentRepository();
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

    const patch = PatchUtil.normalize(patchPayload);
    const nextContent = PatchUtil.apply(document.content, patch);
    const savedDocument = await this.documentRepository.savePatch(
      document,
      nextContent,
      patch,
      actor.id,
    );

    return DocumentDTO.patchAccepted(savedDocument, {
      ...patch,
      version: savedDocument.version,
    });
  }
}

export { DocumentService };
export default DocumentService;
