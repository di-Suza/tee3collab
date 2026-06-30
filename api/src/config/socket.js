import { EnvConfig } from "./env.js";

class SocketConfig {
  static getOptions() {
    return {
      cors: {
        origin: "https://tee3collab.vercel.app",
        credentials: true,
      },
    };
  }
}

export { SocketConfig };
export default SocketConfig;
