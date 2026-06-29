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
}

export { PatchUtil };
export default PatchUtil;
