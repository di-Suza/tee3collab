class DocumentDTO {
  static actorFromLineAuthor(entry) {
    return {
      id: entry.actorId,
      name: entry.actorName || "Someone",
      picture: entry.actorPicture || null,
    };
  }

  static metadata(document) {
    return {
      lineAuthors: (document.lineAuthors || []).map((entry) => ({
        lineNumber: entry.lineNumber,
        actor: DocumentDTO.actorFromLineAuthor(entry),
        version: entry.version,
        updatedAt: entry.updatedAt,
      })),
      conflictMarkers: (document.conflictMarkers || []).map((marker) => ({
        lineNumber: marker.lineNumber,
        message: marker.message,
        reason: marker.reason,
        type: marker.type,
        actor: {
          id: marker.actorId,
          name: marker.actorName || "Someone",
        },
        version: marker.version,
        createdAt: marker.createdAt,
      })),
    };
  }

  static patchPayload(patch) {
    return {
      clientId: patch.clientId,
      baseVersion: patch.baseVersion,
      position: patch.position,
      deleteCount: patch.deleteCount,
      insertText: patch.insertText,
    };
  }

  static snapshot(document) {
    return {
      roomCode: document.roomCode,
      content: document.content,
      version: document.version,
      metadata: DocumentDTO.metadata(document),
      updatedAt: document.updatedAt,
    };
  }

  static patchAccepted(document, appliedPatch) {
    const { conflict, ...patch } = appliedPatch;

    return {
      roomCode: document.roomCode,
      version: document.version,
      content: document.content,
      patch,
      conflict: conflict || null,
      metadata: DocumentDTO.metadata(document),
      updatedAt: document.updatedAt,
    };
  }
}

export { DocumentDTO };
export default DocumentDTO;
