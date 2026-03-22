import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  withCredentials: true, // REQUIRED: sends/receives HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor: on 401, redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
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
