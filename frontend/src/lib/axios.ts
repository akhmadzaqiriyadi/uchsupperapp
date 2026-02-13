import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage (client side only)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optional: Global error handling hook
    // Jika 401, mungkin mau redirect login atau clear token
    if (error.response?.status === 401) {
        // Handle unauthorized (optional logging)
        console.warn("Unauthorized access - redirecting to login?");
    }
    return Promise.reject(error);
  }
);
