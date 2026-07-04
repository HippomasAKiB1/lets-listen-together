import axios from "axios";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("tunetogether-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {}
  }
  return config;
});

export default api;
