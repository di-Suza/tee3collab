import { Router } from "express";
import AuthController from "./auth.controller.js";
import passport from "passport";

class AuthRoute {
  constructor() {
    this.router = Router();
    this.controller = new AuthController();
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.get(
      "/google",
      passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
      }),
    );

    this.router.get(
      "/google/callback",
      passport.authenticate("google", {
        failureRedirect: "/login",
        session: false,
      }),
      this.controller.GoogleCallback.bind(this.controller),
    );
  }

  getRouter() {
    return this.router;
  }
}

export { AuthRoute };
export default new AuthRoute().getRouter();
