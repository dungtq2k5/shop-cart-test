import axios from "axios";
import { API_BASE_URL, AUTH_UNAUTHORIZED_EVENT } from "../config/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send HttpOnly JWT cookie automatically
  headers: { "Content-Type": "application/json" },
});

// Interceptor: on 401, dispatch a custom event for the auth store to react to
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      globalThis.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default api;
