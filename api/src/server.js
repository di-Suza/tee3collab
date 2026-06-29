import http from "node:http";
import { fileURLToPath } from "node:url";
import app from "./app.js";
import { DatabaseConfig } from "./config/db.js";
import { EnvConfig } from "./config/env.js";
import { RedisConfig } from "./config/redis.js";
import { SocketConfig } from "./config/socket.js";
import { SocketGateway } from "./sockets/socketGateway.js";

class HttpServer {
  constructor(expressApp = app) {
    this.app = expressApp;
    this.port = EnvConfig.get("PORT");
    this.httpServer = http.createServer(this.app);
    this.socketGateway = new SocketGateway(this.httpServer);
  }

  async connectInfrastructure() {
    await DatabaseConfig.connect();
    await RedisConfig.connect();
  }

  attachSocketServer() {
    this.socketGateway.init(SocketConfig.getOptions());
  }

  async start() {
    await this.connectInfrastructure();
    this.attachSocketServer();

    this.httpServer.listen(this.port, () => {
      console.log(`CodeRoom API listening on port ${this.port}`);
    });
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const server = new HttpServer();
  server.start().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
}

export { HttpServer };
export default HttpServer;
