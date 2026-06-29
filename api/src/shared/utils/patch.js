class PatchUtil {
  static normalize(rawPatch = {}) {
    return {
      clientId: rawPatch.clientId || null,
      baseVersion: Number(rawPatch.baseVersion),
      position: Number(rawPatch.position),
      deleteCount: Number(rawPatch.deleteCount || 0),
      insertText: String(rawPatch.insertText || ""),
    };
  }

  static apply(content = "", patch) {
    const safePosition = Math.min(patch.position, content.length);
    const deleteEnd = Math.min(safePosition + patch.deleteCount, content.length);

    return (
      content.slice(0, safePosition) +
      patch.insertText +
      content.slice(deleteEnd)
    );
  }
}

export { PatchUtil };
export default PatchUtil;
