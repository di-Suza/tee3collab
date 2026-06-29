import { Router } from "express";
import RoomController from "./room.controller.js";
import AuthMiddleware from "../../shared/middleware/auth.js";
import { validateCreate, validateJoin } from "./room.validator.js";

class RoomRoute {
  constructor() {
    this.router = Router();
    this.controller = new RoomController();
    this.registerRoutes();
  }

  registerRoutes() {
    // Create a new room (protected)
    this.router.post(
      "/create",
      AuthMiddleware.handle,
      validateCreate,
      this.controller.create.bind(this.controller),
    );
    // Join a room by code/password or join link (protected)
    this.router.post(
      "/join",
      AuthMiddleware.handle,
      validateJoin,
      this.controller.join.bind(this.controller),
    );
  }

  getRouter() {
    return this.router;
  }
}

export { RoomRoute };
export default new RoomRoute().getRouter();
