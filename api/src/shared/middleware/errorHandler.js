class ErrorHandlerMiddleware {
  static handle(error, _req, res, _next) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal server error",
      code: error.code || "INTERNAL_SERVER_ERROR",
    });
  }
}

export { ErrorHandlerMiddleware };
export default ErrorHandlerMiddleware;
