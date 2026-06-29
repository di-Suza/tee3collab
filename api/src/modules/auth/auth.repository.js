import User from "./auth.model.js";

class AuthRepository {
  // Domain A will add auth persistence methods here.
  async createUser(userData) {
    return await User.create(userData);
  }

  async findUserByEmail(email) {
    return await User.findOne({ email });
  }

  async findUserByRefreshToken(refreshToken) {
    return await User.findOne({ refreshToken });
  }

  async updateRefreshToken(userId, refreshToken) {
    return await User.findByIdAndUpdate(
      userId,
      { refreshToken },
      { new: true },
    );
  }
}

export { AuthRepository };
export default AuthRepository;
