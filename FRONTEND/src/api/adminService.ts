import type { ApiResponse, PaginatedResponse } from "@/types/common";
import axiosInstance from "./axiosInstance";
import type { AdminUserDetail, UsersListItem } from "@/types/user";

export const adminService = {
  // User management
  getUsers: async (params?: {
    q?: string;
    role_id?: string;
    role_name?: string;
    is_active?: boolean;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const response = await axiosInstance.get<PaginatedResponse<UsersListItem>>(
      "/admin/users",
      { params },
    );
    return response.data;
  },
  getUserById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`);
    return response.data;
  },
  updateUser: async (
    id: string,
    data: { is_active?: boolean; name?: string; phone?: string },
  ) => {
    const response = await axiosInstance.put<ApiResponse<UsersListItem>>(`/admin/users/${id}`, data);
    return response.data;
  },
  updateUserRoles: async (
    id: string,
    data: { role_ids?: string[] } | { role_names?: string[] },
  ) => {
    const response = await axiosInstance.put<ApiResponse<any>>(`/admin/users/${id}/roles`, data);
    return response.data;
  },
  createUser: async (data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role_ids?: string[];
  }) => {
    const response = await axiosInstance.post<ApiResponse<UsersListItem>>(
      "/admin/users",
      data,
    );
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<any>>(
      `/admin/users/delete/${id}`,
    );
    return response.data;
  },



  // Hotel management
  getAdminHotels: async (params?: any) => {
    const response = await axiosInstance.get("/admin/hotels", { params });
    return response.data;
  },
  createHotel: async (data: any) => {
    const response = await axiosInstance.post("/admin/hotels", data);
    return response.data;
  },
  updateHotel: async (id: string | number, data: any) => {
    const response = await axiosInstance.put(`/admin/hotels/${id}`, data);
    return response.data;
  },
  deleteHotel: async (id: string | number) => {
    const response = await axiosInstance.delete(`/admin/hotels/${id}`);
    return response.data;
  },

  // Booking management
  getAdminBookings: async (params?: any) => {
    const response = await axiosInstance.get("/admin/bookings", { params });
    return response.data;
  },
  updateBookingStatus: async (id: string | number, status: string) => {
    const response = await axiosInstance.patch(`/admin/bookings/${id}/status`, {
      status,
    });
    return response.data;
  },

  // Review management
  getAdminReviews: async (params?: any) => {
    const response = await axiosInstance.get("/admin/reviews", { params });
    return response.data;
  },
  updateReview: async (
    id: string | number,
    data: { is_published: boolean },
  ) => {
    const response = await axiosInstance.patch(`/admin/reviews/${id}`, data);
    return response.data;
  },
  bulkPublishReviews: async (
    review_ids: string[] | number[],
    is_published: boolean,
  ) => {
    const response = await axiosInstance.patch("/admin/reviews/bulk-publish", {
      review_ids,
      is_published,
    });
    return response.data;
  },

  // Payment management
  getAdminPayments: async (params?: any) => {
    const response = await axiosInstance.get("/admin/payments", { params });
    return response.data;
  },
  createRefund: async (
    id: string | number,
    data: { amount: number; reason: string },
  ) => {
    const response = await axiosInstance.post(
      `/admin/payments/${id}/refund`,
      data,
    );
    return response.data;
  },

  // Room types
  getRoomTypes: async (hotelId: string | number, params?: any) => {
    const response = await axiosInstance.get(
      `/admin/hotels/${hotelId}/room-types`,
      { params },
    );
    return response.data;
  },
  createRoomType: async (hotelId: string | number, data: any) => {
    const response = await axiosInstance.post(
      `/admin/hotels/${hotelId}/room-types`,
      data,
    );
    return response.data;
  },

  // Rooms
  getRooms: async (params?: any) => {
    const response = await axiosInstance.get("/admin/rooms", { params });
    return response.data;
  },
  updateRoom: async (id: string | number, data: any) => {
    const response = await axiosInstance.put(`/admin/rooms/${id}`, data);
    return response.data;
  },
  bulkUpdateRoomStatus: async (
    room_ids: string[] | number[],
    status: string,
  ) => {
    const response = await axiosInstance.patch("/admin/rooms/bulk-status", {
      room_ids,
      status,
    });
    return response.data;
  },

  // Amenities
  getAmenities: async () => {
    const response = await axiosInstance.get("/admin/amenities");
    return response.data;
  },
  createAmenity: async (data: any) => {
    const response = await axiosInstance.post("/admin/amenities", data);
    return response.data;
  },
  updateAmenity: async (id: string | number, data: any) => {
    const response = await axiosInstance.put(`/admin/amenities/${id}`, data);
    return response.data;
  },
  deleteAmenity: async (id: string | number) => {
    const response = await axiosInstance.delete(`/admin/amenities/${id}`);
    return response.data;
  },
  updateHotelAmenities: async (
    hotelId: string | number,
    amenity_ids: string[] | number[],
  ) => {
    const response = await axiosInstance.put(
      `/admin/amenities/hotels/${hotelId}`,
      { amenity_ids },
    );
    return response.data;
  },
  updateRoomTypeAmenities: async (
    roomTypeId: string | number,
    amenity_ids: string[] | number[],
  ) => {
    const response = await axiosInstance.put(
      `/admin/amenities/room-types/${roomTypeId}`,
      { amenity_ids },
    );
    return response.data;
  },

  // Images
  uploadImages: async (
    files: File[],
    entity_type: string,
    entity_id: string | number,
  ) => {
    const formData = new FormData();
    formData.append("entity_type", entity_type);
    formData.append("entity_id", entity_id.toString());
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await axiosInstance.post(
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
    const response = await axiosInstance.patch("/admin/images/reorder", {
      images,
    });
    return response.data;
  },
  setPrimaryImage: async (id: string | number) => {
    const response = await axiosInstance.patch(
      `/admin/images/${id}/set-primary`,
    );
    return response.data;
  },
  deleteImage: async (id: string | number) => {
    const response = await axiosInstance.delete(`/admin/images/${id}`);
    return response.data;
  },

  // Roles & Permissions
  getRoles: async (params?: any) => {
    const response = await axiosInstance.get("/admin/roles", { params });
    return response.data;
  },
  createRole: async (data: any) => {
    const response = await axiosInstance.post("/admin/roles", data);
    return response.data;
  },
  updateRole: async (id: string | number, data: any) => {
    const response = await axiosInstance.put(`/admin/roles/${id}`, data);
    return response.data;
  },
  deleteRole: async (id: string | number) => {
    const response = await axiosInstance.delete(`/admin/roles/${id}`);
    return response.data;
  },
  updateRolePermissions: async (id: string | number, data: any) => {
    const response = await axiosInstance.put(
      `/admin/roles/${id}/permissions`,
      data,
    );
    return response.data;
  },
  getPermissions: async (params?: any) => {
    const response = await axiosInstance.get("/admin/permissions", { params });
    return response.data;
  },
};
