import { AuthService } from "./auth.service.js";
import { AppError } from "../../shared/errors/AppError.js";
import { EnvConfig } from "../../config/env.js";

class AuthController {
  constructor(authService) {
    this.authService = authService || new AuthService();
  }

  async GoogleCallback(req, res, next) {
    try {
      const userPayload = req.user;
      if (!userPayload || !userPayload.profile) {
        throw new AppError("Google authentication failed", 401);
      }

      const { profile, googleAccessToken, googleRefreshToken } = userPayload;
      const email = profile?.emails?.[0]?.value;
      if (!email) {
        throw new AppError("Google profile email is required", 400);
      }

      const result = await this.authService.createUser({
        emails: [{ value: email }],
        photos: [{ value: profile?.photos?.[0]?.value }],
        displayName: profile?.displayName || profile?.displayName || "",
      });

      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: EnvConfig.get("NODE_ENV") === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: EnvConfig.get("NODE_ENV") === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.redirect(`${EnvConfig.get("FRONTEND_URL")}/auth/success`);

      return res.json({
        success: true,
        data: {
          user: result.user,
          appAccessToken: result.accessToken,
          appRefreshToken: result.refreshToken,
          googleAccessToken,
          googleRefreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError("Unauthorized", 401);
      }

      return res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const refreshToken =
        (req.cookies && req.cookies.refreshToken) || req.body?.refreshToken || req.headers["x-refresh-token"];

      const result = await this.authService.refreshTokens(refreshToken);

      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: EnvConfig.get("NODE_ENV") === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: EnvConfig.get("NODE_ENV") === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export { AuthController };
export default AuthController;
