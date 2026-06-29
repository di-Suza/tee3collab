import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import { EnvConfig } from "../../config/env.js";

class AuthService {
  // Domain A will add auth business rules here.
  constructor(authRepository) {
    this.authRepository = authRepository || new AuthRepository();
  }

  async createUser(userData) {
    const email = userData?.emails?.[0]?.value;
    if (!email) {
      throw new AppError("Email is required to create a user", 400);
    }

    let dbUser = await this.authRepository.findUserByEmail(email);
    if (!dbUser) {
      dbUser = await this.authRepository.createUser({
        email,
        picture: userData?.photos?.[0]?.value,
        name: userData?.displayName || "",
      });
    }

    const payload = {
      id: dbUser._id,
      email: dbUser.email,
      name: dbUser.name,
      picture: dbUser.picture,
    };

    const accessToken = jwt.sign(payload, EnvConfig.get("JWT_ACCESS_SECRET"), {
      expiresIn: EnvConfig.get("JWT_ACCESS_EXPIRES_IN"),
    });

    const refreshToken = crypto.randomBytes(64).toString("hex");
    const userWithToken = await this.authRepository.updateRefreshToken(
      dbUser._id,
      refreshToken,
    );

    return {
      user: userWithToken,
      accessToken,
      refreshToken,
    };
  }
}

export { AuthService };
export default AuthService;
