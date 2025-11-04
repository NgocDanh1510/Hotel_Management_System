import axiosInstance, { publicAxios } from "./axiosInstance";
import type { LoginRequest, RegisterRequest, AuthResponse } from "@/types/auth";
import type { UserProfile, UpdateProfileRequest } from "@/types/user";
import type { ApiResponse } from "@/types/common";

const authService = {
  register: async (data: RegisterRequest): Promise<void> => {
    const response = await publicAxios.post<ApiResponse<void>>(
      "/auth/register",
      data,
    );
    return response.data.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await publicAxios.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      data,
    );
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    const response =
      await axiosInstance.post<ApiResponse<void>>("/auth/logout");
    return response.data.data;
  },

  logoutAll: async (): Promise<void> => {
    const response =
      await axiosInstance.post<ApiResponse<void>>("/auth/logout-all");
    return response.data.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response =
      await axiosInstance.post<ApiResponse<AuthResponse>>("/auth/refresh");
    return response.data.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await axiosInstance.get<ApiResponse<UserProfile>>("/me");
    return response.data.data;
  },

  updateMe: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await axiosInstance.put<ApiResponse<UserProfile>>(
      "/me",
      data,
    );
    return response.data.data;
  },
};

export default authService;
