import { AppError } from "../../shared/errors/AppError.js";

const ROOM_CODE_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;

function validateCreate(req, _res, next) {
  try {
    const { roomCode, password, members } = req.body || {};

    if (!password) {
      throw new AppError("password is required", 400);
    }
    if (roomCode && (typeof roomCode !== "string" || !ROOM_CODE_REGEX.test(roomCode))) {
      throw new AppError("Invalid roomCode format", 400);
    }
    if (typeof password !== "string" || password.length < 4) {
      throw new AppError("Password must be at least 4 characters", 400);
    }

    if (members !== undefined) {
      if (!Array.isArray(members)) {
        throw new AppError("members must be an array", 400);
      }
      for (const m of members) {
        if (typeof m !== "string" || !m.trim()) {
          throw new AppError("each member must be a non-empty user id string", 400);
        }
      }
    }

    if (roomCode) {
      req.body.roomCode = roomCode.toUpperCase();
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

function validateJoin(req, _res, next) {
  try {
    let { roomCode, password, link } = req.body || {};

    if (!roomCode && !link) {
      throw new AppError("roomCode or link is required", 400);
    }

    if (!password) {
      throw new AppError("password is required", 400);
    }

    if (!roomCode && link) {
      try {
        const parts = String(link).split("/").filter(Boolean);
        roomCode = parts[parts.length - 1];
      } catch (e) {
        // fallthrough
      }
    }

    const normalizedRoomCode = String(roomCode || "").toUpperCase();

    if (!ROOM_CODE_REGEX.test(normalizedRoomCode)) {
      throw new AppError("Invalid roomCode format", 400);
    }

    // normalize into body for downstream handlers
    req.body = req.body || {};
    req.body.roomCode = normalizedRoomCode;

    return next();
  } catch (error) {
    return next(error);
  }
}

function validateRoomCodeParam(req, _res, next) {
  try {
    const roomCode = String(req.params.roomCode || "").toUpperCase();

    if (!ROOM_CODE_REGEX.test(roomCode)) {
      throw new AppError("Invalid roomCode format", 400);
    }

    req.params.roomCode = roomCode;
    return next();
  } catch (error) {
    return next(error);
  }
}

function validateJoinInvite(req, _res, next) {
  try {
    let { roomCode, link } = req.body || {};

    if (!roomCode && !link) {
      throw new AppError("roomCode or link is required", 400);
    }

    if (!roomCode && link) {
      try {
        const parts = String(link).split("/").filter(Boolean);
        roomCode = parts[parts.length - 1];
      } catch (e) {
        // fallthrough
      }
    }

    const normalizedRoomCode = String(roomCode || "").toUpperCase();

    if (!ROOM_CODE_REGEX.test(normalizedRoomCode)) {
      throw new AppError("Invalid roomCode format", 400);
    }

    req.body = req.body || {};
    req.body.roomCode = normalizedRoomCode;

    return next();
  } catch (error) {
    return next(error);
  }
}

export { validateCreate, validateJoin, validateJoinInvite, validateRoomCodeParam };
class RoomValidator {
  static validateCreate = validateCreate;
  static validateJoin = validateJoin;
  static validateJoinInvite = validateJoinInvite;
  static validateRoomCodeParam = validateRoomCodeParam;
}

export { RoomValidator };
export default RoomValidator;
