import axios from "axios";
import { env } from "../utils/env.js";
import { tokenStorage } from "../utils/token-storage.js";

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
});

httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshRequest = null;

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      requestUrl.includes("/auth/refresh-token") ||
      requestUrl.includes("/auth/google")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshRequest =
        refreshRequest ||
        httpClient.post("/auth/refresh-token", { refreshToken: tokenStorage.getRefreshToken() }).then((res) => {
          if (res.data?.data?.accessToken) {
             tokenStorage.set(res.data.data.accessToken, res.data.data.refreshToken);
          }
          return res;
        }).finally(() => {
          refreshRequest = null;
        });

      await refreshRequest;
      return httpClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
