import { Server as SocketIOServer } from "socket.io";
import { DocumentSocketHandler } from "./handlers/documentSocket.js";
import { RoomSocketHandler } from "./handlers/roomSocket.js";
import { SocketAuthMiddleware } from "./middleware/socketAuth.js";

class SocketGateway {
  constructor(httpServer) {
    this.httpServer = httpServer;
    this.io = null;
  }

  init(options = {}) {
    this.io = new SocketIOServer(this.httpServer, options);
    this.registerMiddleware();
    this.registerHandlers();
    return this.io;
  }

  registerMiddleware() {
    this.io.use(SocketAuthMiddleware.handle);
  }

  registerHandlers() {
    this.io.on("connection", (socket) => {
      new RoomSocketHandler(this.io, socket).register();
      new DocumentSocketHandler(this.io, socket).register();
    });
  }
}

export { SocketGateway };
export default SocketGateway;
