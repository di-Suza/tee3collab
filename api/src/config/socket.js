import { EnvConfig } from "./env.js";

class SocketConfig {
  static getOptions() {
    return {
      cors: {
        origin: EnvConfig.getCorsOrigins(),
        credentials: true,
      },
    };
  }
}

export { SocketConfig };
export default SocketConfig;
