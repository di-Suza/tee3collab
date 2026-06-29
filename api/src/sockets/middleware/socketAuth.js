class SocketAuthMiddleware {
  static handle(_socket, next) {
    // Domain A will wire socket auth after HTTP auth is finalized.
    return next();
  }
}

export { SocketAuthMiddleware };
export default SocketAuthMiddleware;
