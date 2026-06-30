import { RoomService } from "./room.service.js";
import { AppError } from "../../shared/errors/AppError.js";

class RoomController {
  constructor(roomService) {
    this.roomService = roomService || new RoomService();
  }

  async create(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const { roomCode, password, members = [], name, description } = req.body || {};
      const result = await this.roomService.createRoom({
        createdBy: user.id,
        roomCode,
        password,
        members,
        name,
        description,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async join(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      let { roomCode, password, link } = req.body || {};

      if (!roomCode && link) {
        try {
          const parts = String(link).split("/").filter(Boolean);
          roomCode = parts[parts.length - 1];
        } catch (e) {
          // ignore, will be handled below
        }
      }

      const joined = await this.roomService.joinRoom({ roomCode, password, userId: user.id });

      return res.json({
        success: true,
        data: { room: joined },
      });
    } catch (error) {
      next(error);
    }
  }

  async close(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const room = await this.roomService.closeRoom({
        roomCode: req.params.roomCode,
        userId: user.id,
      });

      return res.json({
        success: true,
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  }

  async detail(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const room = await this.roomService.getRoomDetail({
        roomCode: req.params.roomCode,
        userId: user.id,
      });

      return res.json({
        success: true,
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const room = await this.roomService.updateRoom({
        roomCode: req.params.roomCode,
        userId: user.id,
        name: req.body.name,
        description: req.body.description,
        password: req.body.password,
      });

      return res.json({
        success: true,
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const room = await this.roomService.deleteRoom({
        roomCode: req.params.roomCode,
        userId: user.id,
      });

      return res.json({
        success: true,
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const room = await this.roomService.removeMember({
        roomCode: req.params.roomCode,
        userId: user.id,
        memberId: req.params.memberId,
      });

      return res.json({
        success: true,
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  }

  async leave(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const room = await this.roomService.leaveRoom({
        roomCode: req.params.roomCode,
        userId: user.id,
      });

      return res.json({
        success: true,
        data: { room },
      });
    } catch (error) {
      next(error);
    }
  }

  async joinByInvite(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const joined = await this.roomService.joinRoomByInvite({
        roomCode: req.body.roomCode,
        userId: user.id,
      });

      return res.json({
        success: true,
        data: { room: joined },
      });
    } catch (error) {
      next(error);
    }
  }

  async history(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const history = await this.roomService.getHistory(user.id);

      return res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateCode(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const roomCode = await this.roomService.generateAvailableRoomCode();

      return res.json({
        success: true,
        data: { roomCode },
      });
    } catch (error) {
      next(error);
    }
  }
}

export { RoomController };
export default RoomController;

