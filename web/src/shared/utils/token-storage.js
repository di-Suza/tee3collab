const TOKEN_KEY = "coderoom.accessToken";

export const tokenStorage = {
  get() {
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
  },
};
