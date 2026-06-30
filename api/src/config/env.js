import dotenv from "dotenv";

dotenv.config();

class EnvConfig {
  static values = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT || 5000),
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
    CORS_ORIGINS: process.env.CORS_ORIGINS || "http://localhost:5173",
    MONGO_URI: process.env.MONGO_URI || "",
    REDIS_URL: process.env.REDIS_URL || "",
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
    GOOGLE_CALLBACK_URL:
      process.env.GOOGLE_CALLBACK_URL ||
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:5000/api/v1/auth/google/callback",
    GOOGLE_REDIRECT_URI:
      process.env.GOOGLE_REDIRECT_URI ||
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:5000/api/v1/auth/google/callback",
    FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173",
  };

  static get(key) {
    return this.values[key];
  }

  static getCorsOrigins() {
    return String(this.values.CORS_ORIGINS)
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
}

export { EnvConfig };
export default EnvConfig;
