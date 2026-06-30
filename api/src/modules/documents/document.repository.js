import DocumentModel from "./document.model.js";
import Room from "../rooms/room.model.js";

class DocumentRepository {
  async findRoomByCode(roomCode) {
    return Room.findOne({ roomCode: String(roomCode).toUpperCase() });
  }

  async findByRoomCode(roomCode) {
    return DocumentModel.findOne({ roomCode: String(roomCode).toUpperCase() });
  }

  async createForRoom(room) {
    return DocumentModel.create({
      roomId: room._id,
      roomCode: room.roomCode,
      content: "",
      version: 0,
      patchHistory: [],
    });
  }

  async findOrCreateByRoomCode(roomCode) {
    const normalizedRoomCode = String(roomCode).toUpperCase();
    const room = await this.findRoomByCode(normalizedRoomCode);

    if (!room) {
      return { room: null, document: null };
    }

    let document = await this.findByRoomCode(normalizedRoomCode);

    if (!document) {
      document = await this.createForRoom(room);
    }

    return { room, document };
  }

  async savePatch(document, nextContent, appliedPatch, actorId) {
    const nextVersion = document.version + 1;

    document.content = nextContent;
    document.version = nextVersion;
    document.lastEditedBy = actorId;
    document.patchHistory.push({
      version: nextVersion,
      baseVersion: appliedPatch.baseVersion,
      position: appliedPatch.position,
      deleteCount: appliedPatch.deleteCount,
      insertTextLength: appliedPatch.insertText.length,
      actor: actorId,
      clientId: appliedPatch.clientId || null,
    });

    if (document.patchHistory.length > 200) {
      document.patchHistory = document.patchHistory.slice(-200);
    }

    return document.save();
  }

  async deleteByRoomCode(roomCode) {
    return DocumentModel.deleteOne({ roomCode: String(roomCode).toUpperCase() });
  }
}

export { DocumentRepository };
export default DocumentRepository;
