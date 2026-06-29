import { Router } from "express";

class AuthRoute {
  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    // Domain A will register Google auth routes here.
  }

  getRouter() {
    return this.router;
  }
}

export { AuthRoute };
export default new AuthRoute().getRouter();
