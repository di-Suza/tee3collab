import { NotFoundError } from "../errors/index.js";

class NotFoundMiddleware {
  static handle(req, _res, next) {
    return next(new NotFoundError(`Route ${req.originalUrl} not found`));
  }
}

export { NotFoundMiddleware };
export default NotFoundMiddleware;
