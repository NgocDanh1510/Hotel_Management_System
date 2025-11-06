import axiosInstance, { publicAxios } from "./axiosInstance";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthUser,
} from "@/types/auth";
import type { UserProfile, UpdateProfileRequest } from "@/types/user";
import type { ApiResponse } from "@/types/common";

const authService = {
  register: async (data: RegisterRequest) => {
    const response = await publicAxios.post<ApiResponse<void>>(
      "/auth/register",
      data,
    );
    return response.data;
  },

  login: async (data: LoginRequest) => {
    const response = await publicAxios.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      data,
    );
    return response.data;
  },

  logout: async () => {
    const response =
      await axiosInstance.post<ApiResponse<void>>("/auth/logout");
    return response.data;
  },

  logoutAll: async () => {
    const response =
      await axiosInstance.post<ApiResponse<void>>("/auth/logout-all");
    return response.data;
  },

  refreshToken: async () => {
    const response =
      await axiosInstance.post<ApiResponse<AuthResponse>>("/auth/refresh");
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get<ApiResponse<AuthUser>>("/me");
    return response.data;
  },

  updateMe: async (data: UpdateProfileRequest) => {
    const response = await axiosInstance.put<ApiResponse<UserProfile>>(
      "/me",
      data,
    );
    return response.data;
  },
};

export default authService;
