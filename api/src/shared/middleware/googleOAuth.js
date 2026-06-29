import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { EnvConfig } from "../../config/env.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: EnvConfig.get("GOOGLE_CLIENT_ID"),
      clientSecret: EnvConfig.get("GOOGLE_CLIENT_SECRET"),
      callbackURL: EnvConfig.get("GOOGLE_CALLBACK_URL"),
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        return done(null, {
          profile,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
        });
      } catch (error) {
        return done(error);
      }
    },
  ),
);
