import DocumentModel from "./document.model.js";
import Room from "../rooms/room.model.js";

function lineFromOffset(content = "", offset = 0) {
  return content.slice(0, Math.max(0, offset)).split("\n").length;
}

function patchLineStats(content = "", patch = {}) {
  const safePosition = Math.min(Math.max(patch.position || 0, 0), content.length);
  const deleteEnd = Math.min(safePosition + (patch.deleteCount || 0), content.length);
  const deletedText = content.slice(safePosition, deleteEnd);
  const insertedText = String(patch.insertText || "");
  const startLine = lineFromOffset(content, safePosition);
  const deletedLineCount = Math.max(1, deletedText.split("\n").length);
  const insertedLineCount = Math.max(1, insertedText.split("\n").length);

  return {
    startLine,
    endLine: startLine + deletedLineCount - 1,
    changedLineCount: Math.max(deletedLineCount, insertedLineCount),
    lineDelta: insertedLineCount - deletedLineCount,
  };
}

class DocumentRepository {
  async findRoomByCode(roomCode) {
    return Room.findOne({ roomCode: String(roomCode).toUpperCase() });
  }

  async findByRoomCode(roomCode) {
    return DocumentModel.findOne({ roomCode: String(roomCode).toUpperCase() });
  }

  async createForRoom(room) {
    try {
      return await DocumentModel.findOneAndUpdate(
        { roomCode: room.roomCode },
        {
          $setOnInsert: {
            roomId: room._id,
            roomCode: room.roomCode,
            content: "",
            version: 0,
            patchHistory: [],
            lineAuthors: [],
            conflictMarkers: [],
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );
    } catch (error) {
      if (error?.code === 11000) {
        return DocumentModel.findOne({
          $or: [{ roomCode: room.roomCode }, { roomId: room._id }],
        });
      }

      throw error;
    }
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

  async savePatch(document, nextContent, appliedPatch, actor, conflict = null) {
    const nextVersion = document.version + 1;
    const actorId = actor?.id || actor;
    const lineStats = patchLineStats(document.content, appliedPatch);
    const nextLineCount = nextContent.split("\n").length;

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
    this.updateLineAuthors(document, lineStats, actor, nextVersion, nextLineCount);
    this.updateConflictMarkers(document, lineStats, conflict, actor, nextVersion, nextLineCount);

    if (document.patchHistory.length > 200) {
      document.patchHistory = document.patchHistory.slice(-200);
    }
    if (document.conflictMarkers.length > 100) {
      document.conflictMarkers = document.conflictMarkers.slice(-100);
    }

    return document.save();
  }

  updateLineAuthors(document, lineStats, actor, version, nextLineCount) {
    const actorPayload = {
      actorId: String(actor?.id || actor || ""),
      actorName: actor?.name || "Someone",
      actorPicture: actor?.picture || null,
      version,
      updatedAt: new Date(),
    };
    const nextLineAuthors = new Map();

    for (const entry of document.lineAuthors || []) {
      let lineNumber = Number(entry.lineNumber);

      if (lineNumber > lineStats.endLine) {
        lineNumber += lineStats.lineDelta;
      }

      if (lineNumber < lineStats.startLine || lineNumber >= lineStats.startLine + lineStats.changedLineCount) {
        nextLineAuthors.set(lineNumber, {
          lineNumber,
          actorId: entry.actorId,
          actorName: entry.actorName,
          actorPicture: entry.actorPicture || null,
          version: entry.version,
          updatedAt: entry.updatedAt,
        });
      }
    }

    for (let index = 0; index < lineStats.changedLineCount; index += 1) {
      const lineNumber = lineStats.startLine + index;
      nextLineAuthors.set(lineNumber, {
        lineNumber,
        ...actorPayload,
      });
    }

    document.lineAuthors = Array.from(nextLineAuthors.values())
      .filter((entry) => entry.lineNumber > 0 && entry.lineNumber <= nextLineCount)
      .sort((first, second) => first.lineNumber - second.lineNumber);
  }

  updateConflictMarkers(document, lineStats, conflict, actor, version, nextLineCount) {
    const shiftedMarkers = new Map();

    for (const marker of document.conflictMarkers || []) {
      let lineNumber = Number(marker.lineNumber);

      if (lineNumber > lineStats.endLine) {
        lineNumber += lineStats.lineDelta;
      }

      if (lineNumber > 0) {
        shiftedMarkers.set(lineNumber, {
          lineNumber,
          message: marker.message,
          reason: marker.reason,
          type: marker.type,
          actorId: marker.actorId,
          actorName: marker.actorName,
          version: marker.version,
          createdAt: marker.createdAt,
        });
      }
    }

    if (conflict) {
      const lineNumber = lineStats.startLine;
      const actorName = actor?.name || "Someone";
      const reason = conflict.reason || "Patch was transformed before applying.";

      shiftedMarkers.set(lineNumber, {
        lineNumber,
        message: `${actorName} edit was rebased here. ${reason}`,
        reason,
        type: conflict.type || "POSITION_SHIFT",
        actorId: String(actor?.id || actor || ""),
        actorName,
        version,
        createdAt: new Date(),
      });
    }

    document.conflictMarkers = Array.from(shiftedMarkers.values())
      .filter((marker) => marker.lineNumber > 0 && marker.lineNumber <= nextLineCount)
      .sort((first, second) => first.lineNumber - second.lineNumber);
  }

  async deleteByRoomCode(roomCode) {
    return DocumentModel.deleteOne({ roomCode: String(roomCode).toUpperCase() });
  }
}

export { DocumentRepository };
export default DocumentRepository;
