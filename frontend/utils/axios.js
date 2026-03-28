import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  withCredentials: true, // REQUIRED: sends/receives HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Endpoints where 401 should NOT trigger refresh/redirect
// (e.g. wrong-password on /auth/change-password should just show toast)
const AUTH_ACTION_ENDPOINTS = [
  "/auth/change-password",
  "/auth/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/resend-otp",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
];

// --- Token refresh queue mechanism ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";
    const isAuthAction = AUTH_ACTION_ENDPOINTS.some((ep) => url.includes(ep));

    // Only attempt refresh on 401, non-auth-action endpoints, and not already retried
    if (
      error.response?.status === 401 &&
      !isAuthAction &&
      !originalRequest._retry &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/signup")
    ) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the tokens
        await api.post("/auth/refresh");
        processQueue(null);
        // Retry the original request with new cookies
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh also failed — redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * SWR fetcher factory that injects X-Project-ID header.
 * Required by analytics-service and database/query-service.
 * Usage: useSWR(key, makeProjectFetcher(projectId))
 */
export function makeProjectFetcher(projectId) {
  return (url) =>
    api
      .get(url, { headers: { "X-Project-ID": projectId } })
      .then((res) => res.data.data);
}

export default api;
