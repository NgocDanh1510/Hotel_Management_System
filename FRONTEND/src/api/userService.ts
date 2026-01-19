import axiosInstance from "./axiosInstance";
import type { ApiResponse } from "@/types/common";
import type { UpdateProfileRequest, UserProfile } from "@/types/user";

const userService = {
  getProfile: async () => {
    const response = await axiosInstance.get<ApiResponse<UserProfile>>(
      "/user/profile",
    );
    return response.data;
  },

  updateProfile: async (payload: Pick<UpdateProfileRequest, "name" | "phone">) => {
    const response = await axiosInstance.put<ApiResponse<UserProfile>>(
      "/user/profile",
      payload,
    );
    return response.data;
  },

  updateEmail: async (newEmail: string) => {
    const response = await axiosInstance.put<ApiResponse<{ message: string }>>(
      "/user/email",
      { new_email: newEmail },
    );
    return response.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    const response = await axiosInstance.put<ApiResponse<{ message: string }>>(
      "/user/password",
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
    );
    return response.data;
  },
};

export default userService;
