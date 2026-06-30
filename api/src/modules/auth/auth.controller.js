import { AuthService } from "./auth.service.js";
import { AppError } from "../../shared/errors/AppError.js";
import { EnvConfig } from "../../config/env.js";
import { AuthCookieUtil } from "../../shared/utils/authCookie.js";

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

      const { profile } = userPayload;
      const email = profile?.emails?.[0]?.value;
      if (!email) {
        throw new AppError("Google profile email is required", 400);
      }

      const result = await this.authService.createUser({
        emails: [{ value: email }],
        photos: [{ value: profile?.photos?.[0]?.value }],
        displayName: profile?.displayName || profile?.displayName || "",
      });

      AuthCookieUtil.setAuthCookies(res, result);

      const frontendUrl = EnvConfig.get("FRONTEND_URL") || EnvConfig.get("CLIENT_URL") || "";
      return res.redirect(`${frontendUrl}/auth/success?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`);
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

      AuthCookieUtil.setAuthCookies(res, result);

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

  async updateMe(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      const result = await this.authService.updateProfile(user.id, {
        name: req.body?.name,
        picture: req.body?.picture,
      });

      AuthCookieUtil.setAccessTokenCookie(res, result.accessToken);

      return res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        throw new AppError("Unauthorized", 401);
      }

      await this.authService.logout(user.id);
      AuthCookieUtil.clearAuthCookies(res);

      return res.json({
        success: true,
        data: { loggedOut: true },
      });
    } catch (error) {
      next(error);
    }
  }
}

export { AuthController };
export default AuthController;
