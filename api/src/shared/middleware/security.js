import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { EnvConfig } from "../../config/env.js";
import passport from "passport";
import "./googleOAuth.js";

class SecurityMiddleware {
  static apply(app) {
    app.set("trust proxy", 1);
    app.disable("x-powered-by");
    app.use(helmet());
    app.use(
      cors({
        origin: EnvConfig.getCorsOrigins(),
        credentials: true,
      })
    );
    app.use(passport.initialize());
    app.use(compression());
    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: true, limit: "1mb" }));
    app.use(cookieParser());
    app.use(mongoSanitize());
    app.use(hpp());

    if (EnvConfig.get("NODE_ENV") !== "test") {
      app.use(morgan("dev"));
    }
  }
}

export { SecurityMiddleware };
export default SecurityMiddleware;
