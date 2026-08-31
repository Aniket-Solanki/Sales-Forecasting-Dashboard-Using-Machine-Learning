import axios from "axios";

// Access the backend FastAPI server
// If running locally, this could be http://localhost:8000, but in production we can use environment variables.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
