class ValidateRequestMiddleware {
  static handle(_schema) {
    return (_req, _res, next) => {
      // Module owners will attach schema validation here.
      return next();
    };
  }
}

export { ValidateRequestMiddleware };
export default ValidateRequestMiddleware;
