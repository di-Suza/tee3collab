import { HTTP_STATUS } from "../constants/httpStatus.js";
import { AppError } from "./AppError.js";

class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, HTTP_STATUS.BAD_REQUEST, "BAD_REQUEST");
  }
}

export { BadRequestError };
export default BadRequestError;
