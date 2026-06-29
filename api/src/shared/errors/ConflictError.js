import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AppError } from "./AppError.js";

class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, HTTP_STATUS.CONFLICT, "CONFLICT");
  }
}

export { ConflictError };
export default ConflictError;
