import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AppError } from "./AppError.js";

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, HTTP_STATUS.FORBIDDEN, "FORBIDDEN");
  }
}

export { ForbiddenError };
export default ForbiddenError;
