import jwt from "jsonwebtoken";
import { EnvConfig } from "../../config/env.js";

class SocketAuthMiddleware {
  static readCookieToken(socket) {
    const cookieHeader = socket.handshake.headers.cookie || "";
    const cookies = cookieHeader.split(";").reduce((acc, part) => {
      const [key, ...valueParts] = part.trim().split("=");

      if (key) {
        acc[key] = decodeURIComponent(valueParts.join("="));
      }

      return acc;
    }, {});

    return cookies.accessToken || null;
  }

  static readToken(socket) {
    const authToken = socket.handshake.auth?.token;
    const authHeader = socket.handshake.headers.authorization || "";
    const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

    return authToken || headerToken || this.readCookieToken(socket);
  }

  static handle(socket, next) {
    try {
      const token = SocketAuthMiddleware.readToken(socket);

      if (!token) {
        return next(new Error("Socket authentication token is missing"));
      }

      const secret = EnvConfig.get("JWT_ACCESS_SECRET");
      if (!secret) {
        return next(new Error("JWT secret not configured"));
      }

      socket.user = jwt.verify(token, secret);
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired socket token"));
    }
  }
}

export { SocketAuthMiddleware };
export default SocketAuthMiddleware;
