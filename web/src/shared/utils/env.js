const isProduction = import.meta.env.PROD;

export const env = Object.freeze({
  apiUrl: isProduction
    ? "/api/v1"
    : import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  socketUrl: isProduction
    ? window.location.origin
    : import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
});
