import axios from "axios";

const api = axios.create({
  baseURL: typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
    : ("http://nginx-gateway:5000/api"),
});

// Request interceptor — attach JWT token
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const selectedProjectId = sessionStorage.getItem("selectedProjectId");
    if (selectedProjectId) {
      config.headers["x-project-id"] = selectedProjectId;
    }
  }
  return config;
});

// Response interceptor — handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem("refresh_token");
        if (!refresh_token) throw new Error("No refresh token");

        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/refresh`,
          { refresh_token }
        );

        const { access_token, refresh_token: new_refresh } = res.data.data;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", new_refresh);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
