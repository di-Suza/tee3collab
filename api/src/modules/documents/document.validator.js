import { AppError } from "../../shared/errors/AppError.js";

const ROOM_CODE_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;

function validateRoomCode(req, _res, next) {
  try {
    const roomCode = String(req.params.roomCode || "").toUpperCase();

    if (!ROOM_CODE_REGEX.test(roomCode)) {
      throw new AppError("Invalid roomCode format", 400, "INVALID_ROOM_CODE");
    }

    req.params.roomCode = roomCode;
    return next();
  } catch (error) {
    return next(error);
  }
}

function validatePatch(req, _res, next) {
  try {
    const patch = req.body || {};

    if (!Number.isInteger(patch.baseVersion) || patch.baseVersion < 0) {
      throw new AppError("baseVersion must be a non-negative integer", 400, "INVALID_PATCH");
    }

    if (!Number.isInteger(patch.position) || patch.position < 0) {
      throw new AppError("position must be a non-negative integer", 400, "INVALID_PATCH");
    }

    if (
      patch.deleteCount !== undefined &&
      (!Number.isInteger(patch.deleteCount) || patch.deleteCount < 0)
    ) {
      throw new AppError("deleteCount must be a non-negative integer", 400, "INVALID_PATCH");
    }

    if (patch.insertText !== undefined && typeof patch.insertText !== "string") {
      throw new AppError("insertText must be a string", 400, "INVALID_PATCH");
    }

    const deleteCount = patch.deleteCount || 0;
    const insertText = patch.insertText || "";

    if (deleteCount === 0 && insertText.length === 0) {
      throw new AppError("patch must insert or delete content", 400, "INVALID_PATCH");
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

class DocumentValidator {
  static validateRoomCode = validateRoomCode;
  static validatePatch = validatePatch;
}

export { validatePatch, validateRoomCode };
export { DocumentValidator };
export default DocumentValidator;
