import express from "express";
import authRoutes from "./modules/auth/auth.route.js";
import documentRoutes from "./modules/documents/document.route.js";
import presenceRoutes from "./modules/presence/presence.route.js";
import roomRoutes from "./modules/rooms/room.route.js";
import { ErrorHandlerMiddleware } from "./shared/middleware/errorHandler.js";
import { NotFoundMiddleware } from "./shared/middleware/notFound.js";
import { SecurityMiddleware } from "./shared/middleware/security.js";

class App {
  constructor() {
    this.app = express();
    this.registerGlobalMiddleware();
    this.registerHealthCheck();
    this.registerRoutes();
    this.registerErrorMiddleware();
  }

  getInstance() {
    return this.app;
  }

  registerGlobalMiddleware() {
    SecurityMiddleware.apply(this.app);
  }

  registerHealthCheck() {
    this.app.get("/health", (_req, res) => {
      res.json({
        success: true,
        message: "CodeRoom API is healthy",
      });
    });
  }

  registerRoutes() {
    this.app.use("/api/v1/auth", authRoutes);
    this.app.use("/api/v1/rooms", roomRoutes);
    this.app.use("/api/v1/documents", documentRoutes);
    this.app.use("/api/v1/presence", presenceRoutes);
  }

  registerErrorMiddleware() {
    this.app.use(NotFoundMiddleware.handle);
    this.app.use(ErrorHandlerMiddleware.handle);
  }
}

const appFactory = new App();

export { App };
export default appFactory.getInstance();
