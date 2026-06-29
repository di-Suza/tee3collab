import { Router } from "express";

class DocumentRoute {
  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  registerRoutes() {
    // Domain B will register document routes here.
  }

  getRouter() {
    return this.router;
  }
}

export { DocumentRoute };
export default new DocumentRoute().getRouter();
