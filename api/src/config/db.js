import mongoose from "mongoose";
import EnvConfig from "./env.js";

class DatabaseConfig {
  /**
   * Establishes a connection to the MongoDB database.
   * Uses a try-catch block to handle connection failures gracefully.
   */
  static async connect() {
    try {
      // Check if we already have a connection to avoid redundant calls
      if (mongoose.connection.readyState === 1) {
        console.log("MongoDB is already connected.");
        return;
      }

      const uri = EnvConfig.get("MONGO_URI");
      if (!uri) {
        throw new Error(
          "MONGO_URI is not defined in the environment configuration.",
        );
      }

      await mongoose.connect(uri);
      console.log(" MongoDB connected successfully");
    } catch (error) {
      console.error(" MongoDB connection error:", error.message);
      // In a real app, you might want to exit the process if the DB is critical
      // process.exit(1);
    }
  }

  /**
   * Closes the MongoDB connection.
   */
  static async disconnect() {
    try {
      await mongoose.disconnect();
      console.log(" MongoDB disconnected");
    } catch (error) {
      console.error(" Error while disconnecting MongoDB:", error.message);
    }
  }
}

export { DatabaseConfig };
export default DatabaseConfig;
