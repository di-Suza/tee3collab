import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AppError } from "./AppError.js";

class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, HTTP_STATUS.VALIDATION_ERROR, "VALIDATION_ERROR");
  }
}

export { ValidationError };
export default ValidationError;
