class AsyncHandler {
  static wrap(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
  }
}

export { AsyncHandler };
export default AsyncHandler;
