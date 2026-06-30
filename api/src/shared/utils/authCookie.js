import { EnvConfig } from "../../config/env.js";

class AuthCookieUtil {
  static isSecureCookie() {
    const frontendUrl = EnvConfig.get("FRONTEND_URL") || EnvConfig.get("CLIENT_URL") || "";
    return EnvConfig.get("NODE_ENV") === "production" || frontendUrl.startsWith("https://");
  }

  static sameSitePolicy() {
    return this.isSecureCookie() ? "none" : "lax";
  }

  static baseOptions() {
    return {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: this.sameSitePolicy(),
    };
  }

  static accessTokenOptions() {
    return {
      ...this.baseOptions(),
      maxAge: 24 * 60 * 60 * 1000,
    };
  }

  static refreshTokenOptions() {
    return {
      ...this.baseOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  static setAuthCookies(res, { accessToken, refreshToken }) {
    res.cookie("accessToken", accessToken, this.accessTokenOptions());
    res.cookie("refreshToken", refreshToken, this.refreshTokenOptions());
  }

  static setAccessTokenCookie(res, accessToken) {
    res.cookie("accessToken", accessToken, this.accessTokenOptions());
  }

  static clearAuthCookies(res) {
    res.clearCookie("accessToken", this.baseOptions());
    res.clearCookie("refreshToken", this.baseOptions());
  }
}

export { AuthCookieUtil };
export default AuthCookieUtil;
