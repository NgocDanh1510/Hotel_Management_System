import axiosInstance from "./axiosInstance";
import type {
  CreatePaymentRequest,
  Payment,
  PaymentResponse,
  PaymentStatusResponse,
  UserPayment,
} from "@/types/payment";
import type { ApiResponse } from "@/types/common";

const paymentService = {
  createPayment: async (payload: CreatePaymentRequest) => {
    const response = await axiosInstance.post<ApiResponse<PaymentResponse>>(
      "/payments",
      payload,
    );
    return response.data;
  },

  getPaymentDetail: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<Payment>>(
      `/payments/${id}`,
    );
    return response.data;
  },

  getPaymentStatus: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<PaymentStatusResponse>>(
      `/payments/${id}/status`,
    );
    return response.data;
  },

  mockCompletePayment: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse<Payment>>(
      `/payments/${id}/mock-complete`,
    );
    return response.data;
  },

  listMyPayments: async () => {
    const response = await axiosInstance.get<ApiResponse<UserPayment[]>>(
      "/user/payments",
    );
    return response.data;
  },
};

export default paymentService;
