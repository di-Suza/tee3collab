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

  async refreshTokens(refreshToken) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    const dbUser = await this.authRepository.findUserByRefreshToken(refreshToken);
    if (!dbUser) {
      throw new AppError("Invalid refresh token", 401);
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

    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const userWithToken = await this.authRepository.updateRefreshToken(
      dbUser._id,
      newRefreshToken,
    );

    return {
      user: userWithToken,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async updateProfile(userId, profileData = {}) {
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const updates = {};

    if (profileData.name !== undefined) {
      const name = String(profileData.name || "").trim();

      if (!name) {
        throw new AppError("Name is required", 400);
      }

      updates.name = name;
    }

    if (profileData.picture !== undefined) {
      const picture = String(profileData.picture || "").trim();

      if (picture && !/^https?:\/\/.+/i.test(picture)) {
        throw new AppError("Picture must be a valid URL", 400);
      }

      if (picture) {
        updates.picture = picture;
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("No profile fields provided", 400);
    }

    const updatedUser = await this.authRepository.updateProfile(userId, updates);
    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    const payload = {
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      picture: updatedUser.picture,
    };

    const accessToken = jwt.sign(payload, EnvConfig.get("JWT_ACCESS_SECRET"), {
      expiresIn: EnvConfig.get("JWT_ACCESS_EXPIRES_IN"),
    });

    return {
      user: updatedUser,
      accessToken,
    };
  }
}

export { AuthService };
export default AuthService;
