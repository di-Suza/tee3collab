import jwt from "jsonwebtoken";
import { EnvConfig } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";

class AuthMiddleware {
  static handle(req, _res, next) {
    try {
      const cookieToken = req.cookies && req.cookies.accessToken;
      const header = req.headers && req.headers.authorization;
      const headerToken = header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;
      const token = cookieToken || headerToken;

      if (!token) {
        throw new AppError("Authentication token is missing", 401);
      }

      const secret = EnvConfig.get("JWT_ACCESS_SECRET");
      if (!secret) {
        throw new AppError("JWT secret not configured", 500);
      }

      const payload = jwt.verify(token, secret);
      req.user = payload;
      return next();
    } catch (error) {
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return next(new AppError("Invalid or expired token", 401));
      }
      return next(error instanceof AppError ? error : new AppError(error.message, 401));
    }
  }
}

export { AuthMiddleware };
export default AuthMiddleware;
