import { Router } from "express";

class PresenceRoute {
  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    // Domain C will register presence routes here.
  }

  getRouter() {
    return this.router;
  }
}

export { PresenceRoute };
export default new PresenceRoute().getRouter();
