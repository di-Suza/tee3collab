import axios from "axios";
import { env } from "../utils/env.js";

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
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
        httpClient.post("/auth/refresh-token").finally(() => {
          refreshRequest = null;
        });

      await refreshRequest;
      return httpClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
