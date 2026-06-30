import { AppError } from "../../shared/errors/AppError.js";
import { PatchUtil } from "../../shared/utils/patch.js";

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
    req.body = PatchUtil.normalize(req.body);
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
