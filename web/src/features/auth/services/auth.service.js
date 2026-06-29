import axios from "axios";

const API = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

export class AuthService {
  static async getMe() {
    const res = await API.get("/auth/me");
    return res.data;
  }

  static googleAuthUrl() {
    return "/api/v1/auth/google";
  }
}

export default AuthService;
