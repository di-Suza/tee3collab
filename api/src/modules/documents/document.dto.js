class DocumentDTO {
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
      updatedAt: document.updatedAt,
    };
  }
}

export { DocumentDTO };
export default DocumentDTO;
