import { Router } from "express";
import RoomController from "./room.controller.js";
import AuthMiddleware from "../../shared/middleware/auth.js";

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
      this.controller.create.bind(this.controller),
    );
    // Join a room by code/password or join link (protected)
    this.router.post(
      "/join",
      AuthMiddleware.handle,
      this.controller.join.bind(this.controller),
    );
  }

  getRouter() {
    return this.router;
  }
}

export { RoomRoute };
export default new RoomRoute().getRouter();
