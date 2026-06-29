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
