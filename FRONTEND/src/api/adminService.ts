import type { ApiResponse, PaginatedResponse } from "@/types/common";
import type { AdminUserDetail, UsersListItem } from "@/types/user";
import type {
  AdminAmenityOption,
  AdminBookingListItem,
  AdminHotelListItem,
  AdminImageItem,
  AdminPaymentListItem,
  AdminPermissionListItem,
  AdminRoleDetail,
  AdminRoleListItem,
  AdminReviewListItem,
  AdminRoleOption,
  AdminRoomListItem,
  AdminRoomTypeListItem,
} from "@/features/admin/types";
import axiosInstance from "./axiosInstance";

type UserFilters = {
  q?: string;
  role_id?: string;
  role_name?: string;
  is_active?: boolean;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: string;
};

type OffsetFilters = {
  q?: string;
  offset?: number;
  limit?: number;
  sort?: string;
};

type PageFilters = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "ASC" | "DESC";
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

type CreateUserPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role_ids?: string[];
};

type UpdateUserPayload = {
  is_active?: boolean;
  name?: string;
  phone?: string;
};

type CreateHotelPayload = {
  name: string;
  description?: string;
  address?: string;
  district_id: string;
  star_rating?: number;
  contact_email?: string;
  contact_phone?: string;
  owner_id: string;
  amenity_ids?: string[];
  status?: "pending" | "approved" | "rejected";
};

type UpdateHotelPayload = Partial<CreateHotelPayload> & {
  is_active?: boolean;
};

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

export const adminService = {
  getUsers: async (params?: UserFilters) => {
    const response = await axiosInstance.get<PaginatedResponse<UsersListItem[]>>(
      "/admin/users",
      { params },
    );
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<AdminUserDetail>>(
      `/admin/users/${id}`,
    );
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserPayload) => {
    const response = await axiosInstance.put<ApiResponse<UsersListItem>>(
      `/admin/users/${id}`,
      data,
    );
    return response.data;
  },

  updateUserRoles: async (
    id: string,
    data: { role_ids?: string[] } | { role_names?: string[] },
  ) => {
    const response = await axiosInstance.put<ApiResponse<unknown>>(
      `/admin/users/${id}/roles`,
      data,
    );
    return response.data;
  },

  createUser: async (data: CreateUserPayload) => {
    const response = await axiosInstance.post<ApiResponse<UsersListItem>>(
      "/admin/users",
      data,
    );
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      `/admin/users/delete/${id}`,
    );
    return response.data;
  },

  getAdminHotels: async (params?: HotelFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<AdminHotelListItem[]>
    >("/admin/hotels", { params });
    return response.data;
  },

  createHotel: async (data: CreateHotelPayload) => {
    const response = await axiosInstance.post<ApiResponse<AdminHotelListItem>>(
      "/admin/hotels",
      data,
    );
    return response.data;
  },

  updateHotel: async (id: string | number, data: UpdateHotelPayload) => {
    const response = await axiosInstance.put<ApiResponse<AdminHotelListItem>>(
      `/admin/hotels/${id}`,
      data,
    );
    return response.data;
  },

  updateHotelStatus: async (
    id: string | number,
    status: "pending" | "approved" | "rejected",
  ) => {
    const response = await axiosInstance.put<ApiResponse<AdminHotelListItem>>(
      `/admin/hotels/change-status/${id}`,
      { status },
    );
    return response.data;
  },

  deleteHotel: async (id: string | number) => {
    const response = await axiosInstance.delete<ApiResponse<{ id: string }>>(
      `/admin/hotels/${id}`,
    );
    return response.data;
  },

  getAdminBookings: async (params?: BookingFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<AdminBookingListItem[]>
    >("/admin/bookings", { params });
    return response.data;
  },

  updateBookingStatus: async (id: string | number, status: string) => {
    const response = await axiosInstance.patch<ApiResponse<unknown>>(
      `/admin/bookings/${id}/status`,
      { status },
    );
    return response.data;
  },

  getAdminReviews: async (params?: ReviewFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<AdminReviewListItem[]>
    >("/admin/reviews", { params });
    return response.data;
  },

  updateReview: async (
    id: string | number,
    data: { is_published: boolean },
  ) => {
    const response = await axiosInstance.patch<ApiResponse<AdminReviewListItem>>(
      `/admin/reviews/${id}`,
      data,
    );
    return response.data;
  },

  bulkPublishReviews: async (
    review_ids: string[] | number[],
    is_published: boolean,
  ) => {
    const response = await axiosInstance.patch<ApiResponse<unknown>>(
      "/admin/reviews/bulk-publish",
      { review_ids, is_published },
    );
    return response.data;
  },

  getAdminPayments: async (params?: PaymentFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<AdminPaymentListItem[]>
    >("/admin/payments", { params });
    return response.data;
  },

  createRefund: async (
    id: string | number,
    data: { amount: number; reason: string },
  ) => {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `/admin/payments/${id}/refund`,
      data,
    );
    return response.data;
  },

  getRoomTypes: async (hotelId: string | number, params?: OffsetFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<AdminRoomTypeListItem[]>
    >(`/admin/hotels/${hotelId}/room-types`, { params });
    return response.data;
  },

  createRoomType: async (
    hotelId: string | number,
    data: CreateRoomTypePayload,
  ) => {
    const response = await axiosInstance.post<ApiResponse<AdminRoomTypeListItem>>(
      `/admin/hotels/${hotelId}/room-types`,
      data,
    );
    return response.data;
  },

  getRooms: async (params?: RoomFilters) => {
    const response = await axiosInstance.get<
      PaginatedResponse<AdminRoomListItem[]>
    >("/admin/rooms", { params });
    return response.data;
  },

  updateRoom: async (
    id: string | number,
    data: {
      status?: "available" | "occupied" | "maintenance";
      floor?: number;
      room_number?: string;
      room_type_id?: string;
    },
  ) => {
    const response = await axiosInstance.put<ApiResponse<AdminRoomListItem>>(
      `/admin/rooms/${id}`,
      data,
    );
    return response.data;
  },

  bulkUpdateRoomStatus: async (
    room_ids: string[] | number[],
    status: "maintenance" | "available",
  ) => {
    const response = await axiosInstance.patch<ApiResponse<unknown>>(
      "/admin/rooms/bulk-status",
      {
        room_ids,
        status,
      },
    );
    return response.data;
  },

  getAmenities: async () => {
    const response = await axiosInstance.get<ApiResponse<AdminAmenityOption[]>>(
      "/admin/amenities",
    );
    return response.data;
  },

  createAmenity: async (data: { name: string; icon?: string }) => {
    const response = await axiosInstance.post<ApiResponse<AdminAmenityOption>>(
      "/admin/amenities",
      data,
    );
    return response.data;
  },

  updateAmenity: async (
    id: string | number,
    data: { name: string; icon?: string },
  ) => {
    const response = await axiosInstance.put<ApiResponse<AdminAmenityOption>>(
      `/admin/amenities/${id}`,
      data,
    );
    return response.data;
  },

  deleteAmenity: async (id: string | number) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      `/admin/amenities/${id}`,
    );
    return response.data;
  },

  updateHotelAmenities: async (
    hotelId: string | number,
    amenity_ids: string[] | number[],
  ) => {
    const response = await axiosInstance.put<ApiResponse<unknown>>(
      `/admin/amenities/hotels/${hotelId}`,
      { amenity_ids },
    );
    return response.data;
  },

  updateRoomTypeAmenities: async (
    roomTypeId: string | number,
    amenity_ids: string[] | number[],
  ) => {
    const response = await axiosInstance.put<ApiResponse<unknown>>(
      `/admin/amenities/room-types/${roomTypeId}`,
      { amenity_ids },
    );
    return response.data;
  },

  uploadImages: async (
    files: File[],
    entity_type: string,
    entity_id: string | number,
  ) => {
    const formData = new FormData();
    formData.append("entity_type", entity_type);
    formData.append("entity_id", entity_id.toString());
    files.forEach((file) => {
      formData.append("files[]", file);
    });

    const response = await axiosInstance.post<
      ApiResponse<{
        success_count: number;
        images: AdminImageItem[];
        failed: { originalName: string; reason: string }[];
      }>
    >(
      "/admin/images/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  reorderImages: async (
    images: { id: string | number; sort_order: number }[],
  ) => {
    const response = await axiosInstance.patch<ApiResponse<unknown>>(
      "/admin/images/reorder",
      { images },
    );
    return response.data;
  },

  setPrimaryImage: async (id: string | number) => {
    const response = await axiosInstance.patch<ApiResponse<AdminImageItem>>(
      `/admin/images/${id}/set-primary`,
    );
    return response.data;
  },

  deleteImage: async (id: string | number) => {
    const response = await axiosInstance.delete<ApiResponse<unknown>>(
      `/admin/images/${id}`,
    );
    return response.data;
  },

  getRoles: async (params?: PageFilters & { is_system?: boolean }) => {
    const response = await axiosInstance.get<
      PaginatedResponse<AdminRoleListItem[]>
    >("/admin/roles", { params });
    return response.data;
  },

  getRoleById: async (id: string | number) => {
    const response = await axiosInstance.get<ApiResponse<AdminRoleDetail>>(
      `/admin/roles/${id}`,
    );
    return response.data;
  },

  createRole: async (data: { name: string; description?: string }) => {
    const response = await axiosInstance.post<ApiResponse<AdminRoleOption>>(
      "/admin/roles",
      data,
    );
    return response.data;
  },

  updateRole: async (
    id: string | number,
    data: { name?: string; description?: string },
  ) => {
    const response = await axiosInstance.put<ApiResponse<AdminRoleOption>>(
      `/admin/roles/${id}`,
      data,
    );
    return response.data;
  },

  deleteRole: async (id: string | number) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      `/admin/roles/${id}`,
    );
    return response.data;
  },

  updateRolePermissions: async (id: string | number, data: unknown) => {
    const response = await axiosInstance.put<ApiResponse<unknown>>(
      `/admin/roles/${id}/permissions`,
      data,
    );
    return response.data;
  },

  getPermissions: async (params?: PageFilters & { module?: string }) => {
    const response = await axiosInstance.get<
      PaginatedResponse<AdminPermissionListItem[]>
    >(
      "/admin/permissions",
      { params },
    );
    return response.data;
  },

  getPermissionById: async (id: string | number) => {
    const response = await axiosInstance.get<ApiResponse<AdminPermissionListItem>>(
      `/admin/permissions/${id}`,
    );
    return response.data;
  },

  updatePermission: async (
    id: string | number,
    data: { description?: string | null; module?: string },
  ) => {
    const response = await axiosInstance.put<ApiResponse<AdminPermissionListItem>>(
      `/admin/permissions/${id}`,
      data,
    );
    return response.data;
  },
};
