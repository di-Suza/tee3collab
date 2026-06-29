class DocumentInterface {
  static snapshot() {
    return {
      roomCode: "string",
      content: "string",
      version: "number",
      updatedAt: "Date",
    };
  }

  static patch() {
    return {
      roomCode: "string",
      clientId: "string",
      baseVersion: "number",
      position: "number",
      deleteCount: "number",
      insertText: "string",
    };
  }

  static conflict() {
    return {
      type: "POSITION_SHIFT",
      reason: "string",
      baseVersion: "number",
      serverVersion: "number",
      transformedBy: "Array<{ version, from, to }>",
    };
  }

  static patchHistoryEntry() {
    return {
      version: "number",
      baseVersion: "number",
      position: "number",
      deleteCount: "number",
      insertTextLength: "number",
      actor: "User ObjectId",
      clientId: "string",
      createdAt: "Date",
    };
  }
}

export { DocumentInterface };
export default DocumentInterface;
