import type {
  AdminAmenityOption,
  AdminBookingListItem,
  AdminHotelListItem,
  AdminImageItem,
  AdminPaymentListItem,
  AdminReviewListItem,
  AdminRoomListItem,
  AdminRoomTypeListItem,
} from "@/features/admin/types";
import type { BookingDetail, BookingInvoice } from "./booking";

export interface PartnerDashboardSummary {
  hotels: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  rooms: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    checked_in: number;
    checked_out: number;
    cancelled: number;
    cancellation_pending: number;
    no_show: number;
  };
  payments: {
    total_transactions: number;
    successful_transactions: number;
    gross_revenue: number;
    pending_refund_requests: number;
  };
  reviews: {
    published_count: number;
    average_rating: number;
  };
}

export interface PartnerRoomTypeListItem extends AdminRoomTypeListItem {
  images: AdminImageItem[];
  amenities: AdminAmenityOption[];
}

export type PartnerHotelListItem = AdminHotelListItem;
export type PartnerRoomListItem = AdminRoomListItem;
export type PartnerBookingListItem = AdminBookingListItem;
export type PartnerReviewListItem = AdminReviewListItem;
export type PartnerPaymentListItem = AdminPaymentListItem;
export type PartnerAmenityOption = AdminAmenityOption;
export type PartnerBookingDetail = BookingDetail;
export type PartnerBookingInvoice = BookingInvoice;
