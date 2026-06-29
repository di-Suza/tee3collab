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

      const { roomCode, password, members = [] } = req.body || {};
      const result = await this.roomService.createRoom({
        createdBy: user.id,
        roomCode,
        password,
        members,
      });

      return res.status(201).json({
        success: true,
        data: {
          room: result.room,
          roomCode: result.roomCode,
          joinLink: result.joinLink,
        },
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
}

export { RoomController };
export default RoomController;

