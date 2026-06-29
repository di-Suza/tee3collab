import { OAuth2Client } from "google-auth-library";
import { EnvConfig } from "../../config/env.js";

class GoogleAuthUtil {
  static getClient() {
    return new OAuth2Client(
      EnvConfig.get("GOOGLE_CLIENT_ID"),
      EnvConfig.get("GOOGLE_CLIENT_SECRET"),
      EnvConfig.get("GOOGLE_REDIRECT_URI"),
    );
  }

  static generateAuthUrl() {
    return this.getClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["openid", "email", "profile"],
    });
  }

  static async exchangeCodeForTokens(code) {
    const client = this.getClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      throw new Error("Google did not return an ID token");
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: EnvConfig.get("GOOGLE_CLIENT_ID"),
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Unable to verify Google id_token payload");
    }

    return {
      tokens,
      profile: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
    };
  }
}

export { GoogleAuthUtil };
export default GoogleAuthUtil;
