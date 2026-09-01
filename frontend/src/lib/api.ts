import axios from "axios";

// If NEXT_PUBLIC_API_URL is not set, default to the production Railway backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://sales-forecasting-dashboard-using-machine-learni-production.up.railway.app/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach the JWT token to every request if it exists
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("user_data");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);
