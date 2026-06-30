class SocketRegistry {
  static io = null;

  static setServer(io) {
    SocketRegistry.io = io;
  }

  static getServer() {
    return SocketRegistry.io;
  }
}

export { SocketRegistry };
export default SocketRegistry;
