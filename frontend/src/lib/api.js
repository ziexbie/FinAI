import axios from "axios";

const api = axios.create({
  // Use the frontend origin as a proxy target so browser requests avoid Render CORS checks.
  baseURL: "/api",
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
