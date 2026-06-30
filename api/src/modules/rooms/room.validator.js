import { AppError } from "../../shared/errors/AppError.js";

const ROOM_CODE_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;

function validateCreate(req, _res, next) {
  try {
    const { roomCode, password, members, name, description } = req.body || {};

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

    if (name !== undefined) {
      const normalizedName = String(name).trim();

      if (normalizedName.length > 80) {
        throw new AppError("Room name must be 80 characters or less", 400);
      }

      req.body.name = normalizedName;
    }

    if (description !== undefined) {
      const normalizedDescription = String(description).trim();

      if (normalizedDescription.length > 240) {
        throw new AppError("Room description must be 240 characters or less", 400);
      }

      req.body.description = normalizedDescription;
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

function validateMemberParam(req, _res, next) {
  try {
    const memberId = String(req.params.memberId || "").trim();

    if (!memberId) {
      throw new AppError("memberId is required", 400);
    }

    req.params.memberId = memberId;
    return next();
  } catch (error) {
    return next(error);
  }
}

function validateUpdate(req, _res, next) {
  try {
    const body = req.body || {};

    if (body.roomCode !== undefined) {
      throw new AppError("roomCode cannot be changed after room creation", 400);
    }

    const hasName = Object.prototype.hasOwnProperty.call(body, "name");
    const hasDescription = Object.prototype.hasOwnProperty.call(body, "description");
    const hasPassword = Object.prototype.hasOwnProperty.call(body, "password");

    if (!hasName && !hasDescription && !hasPassword) {
      throw new AppError("At least one room update is required", 400);
    }

    if (hasName) {
      const name = String(body.name || "").trim();

      if (name.length > 80) {
        throw new AppError("Room name must be 80 characters or less", 400);
      }

      req.body.name = name;
    }

    if (hasDescription) {
      const description = String(body.description || "").trim();

      if (description.length > 240) {
        throw new AppError("Room description must be 240 characters or less", 400);
      }

      req.body.description = description;
    }

    if (hasPassword) {
      const password = String(body.password || "");

      if (password && password.length < 4) {
        throw new AppError("Password must be at least 4 characters", 400);
      }

      req.body.password = password;
    }

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

export {
  validateCreate,
  validateJoin,
  validateJoinInvite,
  validateMemberParam,
  validateRoomCodeParam,
  validateUpdate,
};
class RoomValidator {
  static validateCreate = validateCreate;
  static validateJoin = validateJoin;
  static validateJoinInvite = validateJoinInvite;
  static validateMemberParam = validateMemberParam;
  static validateRoomCodeParam = validateRoomCodeParam;
  static validateUpdate = validateUpdate;
}

export { RoomValidator };
export default RoomValidator;
