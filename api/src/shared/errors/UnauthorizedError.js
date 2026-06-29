import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AppError } from "./AppError.js";

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, HTTP_STATUS.UNAUTHORIZED, "UNAUTHORIZED");
  }
}

export { UnauthorizedError };
export default UnauthorizedError;
