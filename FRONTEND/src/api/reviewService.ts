import axiosInstance from "./axiosInstance";
import type { ApiResponse } from "@/types/common";
import type { CreateReviewRequest, UserReview } from "@/types/review";

const reviewService = {
  createReview: async (payload: CreateReviewRequest) => {
    const response = await axiosInstance.post<ApiResponse<UserReview>>(
      "/reviews",
      payload,
    );
    return response.data;
  },

  listMyReviews: async () => {
    const response = await axiosInstance.get<ApiResponse<UserReview[]>>(
      "/user/reviews",
    );
    return response.data;
  },

  getMyReviewDetail: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<UserReview>>(
      `/user/reviews/${id}`,
    );
    return response.data;
  },

  updateMyReview: async (
    id: string,
    payload: Partial<CreateReviewRequest>,
  ) => {
    const response = await axiosInstance.put<ApiResponse<UserReview>>(
      `/user/reviews/${id}`,
      payload,
    );
    return response.data;
  },

  deleteMyReview: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      `/user/reviews/${id}`,
    );
    return response.data;
  },
};

export default reviewService;
