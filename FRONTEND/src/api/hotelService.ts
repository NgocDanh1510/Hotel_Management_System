import { publicAxios } from "./axiosInstance";
import type {
  HotelListItem,
  HotelDetail,
  RoomAvailability,
} from "@/types/hotel";
import type { Review } from "@/types/review";
import type { ApiResponse, PaginationMeta } from "@/types/common";

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
  getHotels: async (
    params: GetHotelsParams,
  ): Promise<{ data: HotelListItem[]; meta?: PaginationMeta }> => {
    const response = await publicAxios.get<ApiResponse<HotelListItem[]>>(
      "/hotels",
      { params },
    );
    return { data: response.data.data, meta: response.data.meta };
  },

  getHotelBySlug: async (
    slug: string,
  ): Promise<{ data: HotelDetail; meta?: PaginationMeta }> => {
    const response = await publicAxios.get<ApiResponse<HotelDetail>>(
      `/hotels/${slug}`,
    );
    return { data: response.data.data, meta: response.data.meta };
  },

  getHotelAvailability: async (
    hotelId: string,
    params: GetHotelAvailabilityParams,
  ): Promise<{ data: RoomAvailability[]; meta?: PaginationMeta }> => {
    const response = await publicAxios.get<ApiResponse<RoomAvailability[]>>(
      `/hotels/${hotelId}/rooms/availability`,
      { params },
    );
    return { data: response.data.data, meta: response.data.meta };
  },

  getHotelReviews: async (
    hotelId: string,
    params: GetHotelReviewsParams,
  ): Promise<{ data: Review[]; meta?: PaginationMeta }> => {
    const response = await publicAxios.get<ApiResponse<Review[]>>(
      `/hotels/${hotelId}/reviews`,
      { params },
    );
    return { data: response.data.data, meta: response.data.meta };
  },
};

export default hotelService;
