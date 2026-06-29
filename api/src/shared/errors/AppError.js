import { HTTP_STATUS } from "../constants/httpStatus.js";

class AppError extends Error {
  constructor(message = "Something went wrong", statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = "APP_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export { AppError };
export default AppError;
