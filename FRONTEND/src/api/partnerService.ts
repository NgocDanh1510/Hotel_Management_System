import axiosInstance from "./axiosInstance";
import type { ApiResponse, PaginatedResponse } from "@/types/common";
import type {
  HotelImageItem,
  HotelImageUploadPayload,
} from "@/features/admin/types";
import type {
  PartnerAmenityOption,
  PartnerBookingDetail,
  PartnerBookingInvoice,
  PartnerBookingListItem,
  PartnerDashboardSummary,
  PartnerHotelListItem,
  PartnerPaymentListItem,
  PartnerReviewListItem,
  PartnerRoomListItem,
  PartnerRoomTypeListItem,
} from "@/types/partner";

type OffsetFilters = {
  q?: string;
  offset?: number;
  limit?: number;
  sort?: string;
};

type HotelFilters = OffsetFilters & {
  is_active?: boolean;
  status?: "pending" | "approved" | "rejected";
  owner_id?: string;
  district_id?: string;
  star_rating_min?: number;
  star_rating_max?: number;
  created_at_from?: string;
  created_at_to?: string;
};

type BookingFilters = OffsetFilters & {
  status?: string;
  hotel_id?: string;
  room_id?: string;
  user_id?: string;
};

type ReviewFilters = OffsetFilters & {
  is_published?: boolean;
  hotel_id?: string;
  user_id?: string;
  rating_overall_min?: number;
  rating_overall_max?: number;
};

type PaymentFilters = OffsetFilters & {
  status?: string;
  type?: string;
  gateway?: string;
  booking_id?: string;
};

type RoomFilters = OffsetFilters & {
  hotel_id?: string;
  room_type_id?: string;
  status?: "available" | "occupied" | "maintenance";
  floor?: number;
};

type CreateHotelPayload = {
  name: string;
  description?: string;
  address?: string;
  district_id: string;
  star_rating?: number;
  contact_email?: string;
  contact_phone?: string;
  amenity_ids?: string[];
  slug?: string;
};

type UpdateHotelPayload = Partial<CreateHotelPayload>;

type CreateRoomTypePayload = {
  name: string;
  description?: string;
  base_price: number;
  currency: string;
  max_occupancy: number;
  total_rooms: number;
  bed_type?: string;
  size_sqm?: number | null;
};

export const partnerService = {
  getDashboard: async () => {
    const response = await axiosInstance.get<ApiResponse<PartnerDashboardSummary>>(
      "/partner/dashboard",
    );
    return response.data;
  },

  getHotels: async (params?: HotelFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<PartnerHotelListItem[]>
    >("/partner/hotels", { params });
    return response.data;
  },

  createHotel: async (data: CreateHotelPayload) => {
    const response = await axiosInstance.post<ApiResponse<PartnerHotelListItem>>(
      "/partner/hotels",
      data,
    );
    return response.data;
  },

  updateHotel: async (id: string, data: UpdateHotelPayload) => {
    const response = await axiosInstance.put<ApiResponse<PartnerHotelListItem>>(
      `/partner/hotels/${id}`,
      data,
    );
    return response.data;
  },

  submitHotelForReview: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse<PartnerHotelListItem>>(
      `/partner/hotels/${id}/submit-for-review`,
    );
    return response.data;
  },

  getHotelImages: async (hotelId: string) => {
    const response = await axiosInstance.get<ApiResponse<HotelImageItem[]>>(
      `/partner/hotels/${hotelId}/images`,
    );
    return response.data;
  },

  addHotelImage: async (hotelId: string, data: HotelImageUploadPayload) => {
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.sort_order !== undefined) {
      formData.append("sort_order", data.sort_order.toString());
    }
    if (data.is_primary !== undefined) {
      formData.append("is_primary", data.is_primary.toString());
    }

    const response = await axiosInstance.post<ApiResponse<HotelImageItem>>(
      `/partner/hotels/${hotelId}/images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  deleteHotelImage: async (hotelId: string, imageId: string) => {
    const response = await axiosInstance.delete<ApiResponse<unknown>>(
      `/partner/hotels/${hotelId}/images/${imageId}`,
    );
    return response.data;
  },

  getRoomTypes: async (hotelId: string, params?: OffsetFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<PartnerRoomTypeListItem[]>
    >(`/partner/hotels/${hotelId}/room-types`, { params });
    return response.data;
  },

  createRoomType: async (hotelId: string, data: CreateRoomTypePayload) => {
    const response = await axiosInstance.post<ApiResponse<PartnerRoomTypeListItem>>(
      `/partner/hotels/${hotelId}/room-types`,
      data,
    );
    return response.data;
  },

  updateRoomTypePrice: async (
    id: string,
    data: { base_price: number; currency?: string },
  ) => {
    const response = await axiosInstance.patch<ApiResponse<PartnerRoomTypeListItem>>(
      `/partner/room-types/${id}/price`,
      data,
    );
    return response.data;
  },

  getRooms: async (params?: RoomFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<PartnerRoomListItem[]>
    >("/partner/rooms", { params });
    return response.data;
  },

  updateRoom: async (
    id: string,
    data: {
      floor?: number;
      room_number?: string;
      room_type_id?: string;
    },
  ) => {
    const response = await axiosInstance.put<ApiResponse<PartnerRoomListItem>>(
      `/partner/rooms/${id}`,
      data,
    );
    return response.data;
  },

  bulkUpdateRoomStatus: async (
    room_ids: string[],
    status: "maintenance" | "available",
  ) => {
    const response = await axiosInstance.patch<ApiResponse<{ updated_count: number }>>(
      "/partner/rooms/bulk-status",
      { room_ids, status },
    );
    return response.data;
  },

  updateRoomAvailability: async (
    id: string,
    status: "maintenance" | "available",
  ) => {
    const response = await axiosInstance.patch<ApiResponse<{ updated_count: number }>>(
      `/partner/rooms/${id}/availability`,
      { status },
    );
    return response.data;
  },

  getBookings: async (params?: BookingFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<PartnerBookingListItem[]>
    >("/partner/bookings", { params });
    return response.data;
  },

  getBookingDetail: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<PartnerBookingDetail>>(
      `/partner/bookings/${id}`,
    );
    return response.data;
  },

  getBookingInvoice: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<PartnerBookingInvoice>>(
      `/partner/bookings/${id}/invoice`,
    );
    return response.data;
  },

  cancelBooking: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse<PartnerBookingListItem>>(
      `/partner/bookings/${id}/cancel`,
    );
    return response.data;
  },

  updateBookingStatus: async (id: string, status: string) => {
    const response = await axiosInstance.patch<ApiResponse<PartnerBookingListItem>>(
      `/partner/bookings/${id}/status`,
      { status },
    );
    return response.data;
  },

  setBookingNoShow: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse<PartnerBookingListItem>>(
      `/partner/bookings/${id}/no-show`,
    );
    return response.data;
  },

  getReviews: async (params?: ReviewFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<PartnerReviewListItem[]>
    >("/partner/reviews", { params });
    return response.data;
  },

  getPayments: async (params?: PaymentFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<PartnerPaymentListItem[]>
    >("/partner/payments", { params });
    return response.data;
  },

  getAmenities: async () => {
    const response = await axiosInstance.get<ApiResponse<PartnerAmenityOption[]>>(
      "/partner/amenities",
    );
    return response.data;
  },

  updateHotelAmenities: async (hotelId: string, amenity_ids: string[]) => {
    const response = await axiosInstance.put<ApiResponse<unknown>>(
      `/partner/amenities/hotels/${hotelId}`,
      { amenity_ids },
    );
    return response.data;
  },

  updateRoomTypeAmenities: async (roomTypeId: string, amenity_ids: string[]) => {
    const response = await axiosInstance.put<ApiResponse<unknown>>(
      `/partner/amenities/room-types/${roomTypeId}`,
      { amenity_ids },
    );
    return response.data;
  },
};
