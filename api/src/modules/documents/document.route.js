import { Router } from "express";
import AuthMiddleware from "../../shared/middleware/auth.js";
import DocumentController from "./document.controller.js";
import { validatePatch, validateRoomCode } from "./document.validator.js";

class DocumentRoute {
  constructor() {
    this.router = Router();
    this.controller = new DocumentController();
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.get(
      "/:roomCode",
      AuthMiddleware.handle,
      validateRoomCode,
      this.controller.getSnapshot.bind(this.controller),
    );

    this.router.patch(
      "/:roomCode/patch",
      AuthMiddleware.handle,
      validateRoomCode,
      validatePatch,
      this.controller.applyPatch.bind(this.controller),
    );
  }

  getRouter() {
    return this.router;
  }
}

export { DocumentRoute };
export default new DocumentRoute().getRouter();
