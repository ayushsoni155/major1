// API client utilities - Supabase has been removed
// All API calls go through the axios instance in @/utils/axios
// which routes to the API gateway at localhost:5000

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
