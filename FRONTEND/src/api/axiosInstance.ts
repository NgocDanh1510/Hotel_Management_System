import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
const BASE_URL = "http://localhost:5000/api/v1";

// Main axios instance with interceptors for token refresh
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true, // for httpOnly refresh_token cookie
});

// Request interceptor: add access token to headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: handle token refresh on 401, redirect on 403
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized: attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint
        const refreshResponse = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        // Save new access token
        const { access_token } = refreshResponse.data;
        localStorage.setItem("access_token", access_token);

        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Retry original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed: clear storage and redirect to login
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden: redirect to forbidden page
    if (error.response?.status === 403) {
      window.location.href = "/forbidden";
      return Promise.reject(error);
    }

    // Reject other errors
    return Promise.reject(error);
  },
);

// Public axios instance (no interceptors, for public endpoints)
const publicAxios: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

publicAxios.interceptors.response.use(
  (res) => {
    return res;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosInstance;
export { publicAxios };
