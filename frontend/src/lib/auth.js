export const AUTH_TOKEN_KEY = "mern_auth_token";

export const getStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const storeToken = (token) => {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeToken = () => {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};
