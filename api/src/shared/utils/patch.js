import { AppError } from "../errors/AppError.js";

class PatchUtil {
  static normalize(rawPatch = {}) {
    const patch = {
      clientId: rawPatch.clientId || null,
      baseVersion: Number(rawPatch.baseVersion),
      position: Number(rawPatch.position),
      deleteCount: Number(rawPatch.deleteCount || 0),
      insertText: String(rawPatch.insertText || ""),
    };

    this.validate(patch);

    return patch;
  }

  static validate(patch) {
    if (!Number.isInteger(patch.baseVersion) || patch.baseVersion < 0) {
      throw new AppError("baseVersion must be a non-negative integer", 400, "INVALID_PATCH");
    }

    if (!Number.isInteger(patch.position) || patch.position < 0) {
      throw new AppError("position must be a non-negative integer", 400, "INVALID_PATCH");
    }

    if (!Number.isInteger(patch.deleteCount) || patch.deleteCount < 0) {
      throw new AppError("deleteCount must be a non-negative integer", 400, "INVALID_PATCH");
    }

    if (typeof patch.insertText !== "string") {
      throw new AppError("insertText must be a string", 400, "INVALID_PATCH");
    }

    if (patch.deleteCount === 0 && patch.insertText.length === 0) {
      throw new AppError("patch must insert or delete content", 400, "INVALID_PATCH");
    }
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

  static transformAgainstHistory(patch, patchHistory = []) {
    let nextPosition = patch.position;
    const transformedBy = [];

    for (const historicalPatch of patchHistory) {
      if (historicalPatch.version <= patch.baseVersion) {
        continue;
      }

      const oldPosition = nextPosition;
      const historyPosition = historicalPatch.position;
      const historyDeleteCount = historicalPatch.deleteCount || 0;
      const historyInsertLength = historicalPatch.insertTextLength || 0;
      const historyDeleteEnd = historyPosition + historyDeleteCount;

      if (historyDeleteCount > 0 && nextPosition > historyPosition) {
        if (nextPosition <= historyDeleteEnd) {
          nextPosition = historyPosition;
        } else {
          nextPosition -= historyDeleteCount;
        }
      }

      if (historyInsertLength > 0 && historyPosition <= nextPosition) {
        nextPosition += historyInsertLength;
      }

      if (oldPosition !== nextPosition) {
        transformedBy.push({
          version: historicalPatch.version,
          from: oldPosition,
          to: nextPosition,
        });
      }
    }

    return {
      ...patch,
      position: Math.max(0, nextPosition),
      transformedBy,
    };
  }
}

export { PatchUtil };
export default PatchUtil;
