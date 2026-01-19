import axiosInstance from "./axiosInstance";
import type {
  BookingDetail,
  BookingInvoice,
  BookingListItem,
  CreateBookingRequest,
} from "@/types/booking";
import type { ApiResponse, PaginatedResponse } from "@/types/common";

interface ListMyBookingsParams {
  status?: string;
  sort?: "created_at" | "check_in";
  offset?: number;
  limit?: number;
}

const bookingService = {
  createBooking: async (payload: CreateBookingRequest) => {
    const response = await axiosInstance.post<
      ApiResponse<{
        booking: BookingListItem;
      }>
    >("/bookings", payload);
    return response.data;
  },

  getBookingDetail: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<BookingDetail>>(
      `/bookings/${id}`,
    );
    return response.data;
  },

  cancelBooking: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse<BookingListItem>>(
      `/bookings/${id}/cancel`,
    );
    return response.data;
  },

  getBookingInvoice: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<BookingInvoice>>(
      `/bookings/${id}/invoice`,
    );
    return response.data;
  },

  listMyBookings: async (params: ListMyBookingsParams) => {
    const response = await axiosInstance.get<PaginatedResponse<BookingListItem[]>>(
      "/user/bookings",
      { params },
    );
    return response.data;
  },
};

export default bookingService;
