import bcrypt from "bcryptjs";

class PasswordHashUtil {
  static async hash(value) {
    return bcrypt.hash(value, 10);
  }

  static async compare(value, hash) {
    if (!value || !hash) {
      return false;
    }

    return bcrypt.compare(value, hash);
  }
}

export { PasswordHashUtil };
export default PasswordHashUtil;
