class AuthMiddleware {
  static handle(_req, _res, next) {
    // Domain A will wire JWT/session verification here.
    return next();
  }
}

export { AuthMiddleware };
export default AuthMiddleware;
