import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  withCredentials: true, // REQUIRED: sends/receives HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor: on 401, redirect to login unless it's an auth-action endpoint
// (e.g. wrong-password on /auth/change-password should NOT redirect — just show toast)
const AUTH_ACTION_ENDPOINTS = [
  "/auth/change-password",
  "/auth/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/resend-otp",
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthAction = AUTH_ACTION_ENDPOINTS.some(ep => url.includes(ep));
    if (
      error.response?.status === 401 &&
      !isAuthAction &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/signup")
    ) {
      window.location.href = "/login";
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
