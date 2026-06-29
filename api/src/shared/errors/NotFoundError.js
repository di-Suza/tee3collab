import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AppError } from "./AppError.js";

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, HTTP_STATUS.NOT_FOUND, "NOT_FOUND");
  }
}

export { NotFoundError };
export default NotFoundError;
