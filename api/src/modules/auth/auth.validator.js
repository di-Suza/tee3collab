import { z } from "zod";

class AuthValidator {
  static createUser() {
    return z.object({
      emails: z
        .array(
          z.object({
            value: z.string().email(),
          }),
        )
        .nonempty({ message: "At least one email is required" }),
      photos: z
        .array(
          z.object({
            value: z.string().url(),
          }),
        )
        .optional(),
      displayName: z.string().min(1, {
        message: "displayName is required",
      }),
    });
  }
}

export { AuthValidator };
export default AuthValidator;
