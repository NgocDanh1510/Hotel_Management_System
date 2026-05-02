import { publicAxios } from "./axiosInstance";
import type {
  HotelListItem,
  HotelDetail,
  RoomAvailability,
} from "@/types/hotel";
import type { Review } from "@/types/review";
import type { ApiResponse, PaginatedResponse } from "@/types/common";

interface GetHotelsParams {
  q?: string;
  city?: string;
  country?: string;
  star_rating_min?: number;
  star_rating_max?: number;
  price_min?: number;
  price_max?: number;
  amenity_ids?: string[];
  check_in?: string;
  check_out?: string;
  guests?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

interface GetHotelAvailabilityParams {
  check_in: string;
  check_out: string;
  guests: number;
}

interface GetHotelReviewsParams {
  rating_overall_min?: number;
  rating_overall_max?: number;
  offset?: number;
  limit?: number;
}

const hotelService = {
  getHotels: async (params: GetHotelsParams) => {
    const response = await publicAxios.get<PaginatedResponse<HotelListItem[]>>(
      "/hotels",
      { params },
    );
    return response.data;
  },

  getHotelBySlug: async (slug: string) => {
    const response = await publicAxios.get<ApiResponse<HotelDetail>>(
      `/hotels/${slug}`,
    );
    return response.data;
  },

  getHotelAvailability: async (
    hotelId: string,
    params: GetHotelAvailabilityParams,
  ) => {
    const response = await publicAxios.get<ApiResponse<RoomAvailability[]>>(
      `/hotels/${hotelId}/rooms/availability`,
      { params },
    );
    return response.data;
  },

  getHotelReviews: async (hotelId: string, params: GetHotelReviewsParams) => {
    const response = await publicAxios.get<ApiResponse<Review[]>>(
      `/hotels/${hotelId}/reviews`,
      { params },
    );
    return response.data;
  },
};

export default hotelService;
