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
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
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
