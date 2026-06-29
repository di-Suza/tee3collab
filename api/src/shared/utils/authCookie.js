import { EnvConfig } from "../../config/env.js";

class AuthCookieUtil {
  static accessTokenOptions() {
    return {
      httpOnly: true,
      secure: EnvConfig.get("NODE_ENV") === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    };
  }

  static refreshTokenOptions() {
    return {
      httpOnly: true,
      secure: EnvConfig.get("NODE_ENV") === "production",
      sameSite: "strict",
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
}

export { AuthCookieUtil };
export default AuthCookieUtil;
