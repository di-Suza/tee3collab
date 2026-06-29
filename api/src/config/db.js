class DatabaseConfig {
  static async connect() {
    // MongoDB connection setup will be implemented by the persistence owner.
  }

  static async disconnect() {
    // MongoDB disconnect setup will be implemented when persistence is wired.
  }
}

export { DatabaseConfig };
export default DatabaseConfig;
