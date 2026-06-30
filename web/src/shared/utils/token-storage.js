export const tokenStorage = {
  get() {
    return window.localStorage.getItem("coderoom.accessToken");
  },
  getRefreshToken() {
    return window.localStorage.getItem("coderoom.refreshToken");
  },
  set(accessToken, refreshToken) {
    if (accessToken) window.localStorage.setItem("coderoom.accessToken", accessToken);
    if (refreshToken) window.localStorage.setItem("coderoom.refreshToken", refreshToken);
  },
  clear() {
    window.localStorage.removeItem("coderoom.accessToken");
    window.localStorage.removeItem("coderoom.refreshToken");
  },
};
