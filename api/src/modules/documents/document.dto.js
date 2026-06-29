class DocumentDTO {
  static snapshot(document) {
    return {
      roomCode: document.roomCode,
      content: document.content,
      version: document.version,
      updatedAt: document.updatedAt,
    };
  }

  static patchAccepted(document, appliedPatch) {
    return {
      roomCode: document.roomCode,
      version: document.version,
      patch: appliedPatch,
      updatedAt: document.updatedAt,
    };
  }
}

export { DocumentDTO };
export default DocumentDTO;
