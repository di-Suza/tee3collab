import { Router } from "express";

class RoomRoute {
  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    // Domain A will register room create/join/host routes here.
  }

  getRouter() {
    return this.router;
  }
}

export { RoomRoute };
export default new RoomRoute().getRouter();
