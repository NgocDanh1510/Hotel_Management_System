import type { Payment } from "./payment";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "cancellation_pending"
  | "expired";

export interface BookingListItem {
  id: string;
  hotel_name: string;
  room_number: string;
  room_type_name: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  price_per_night: number;
  status: BookingStatus;
  expires_at: string;
  special_requests: string;
  created_at: string;
}

export interface BookingUser {
  id: string;
  name: string;
  email: string;
}

export interface BookingHotel {
  id: string;
  name: string;
  slug?: string;
  address?: string;
  city?: string;
  district?: string;
}

export interface BookingRoom {
  id: string;
  room_number: string;
  floor?: number;
  status?: string;
}

export interface BookingRoomType {
  id: string;
  name: string;
  max_occupancy?: number;
  base_price?: number;
  currency?: string;
}

export interface BookingDetail {
  id: string;
  user: BookingUser;
  hotel: BookingHotel;
  room: BookingRoom;
  room_type: BookingRoomType;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  price_per_night: number;
  status: BookingStatus;
  special_requests: string;
  expires_at: string;
  payments: Payment[];
  created_at: string;
  updated_at: string;
}

export interface BookingInvoice {
  invoice_id: string;
  booking_id: string;
  issued_at: string;
  customer: BookingUser & { phone?: string };
  hotel: BookingHotel & { address?: string; city?: string };
  room_details: {
    room_number?: string;
    room_type?: string;
  };
  stay_details: {
    check_in: string;
    check_out: string;
    guests: number;
  };
  billing: {
    total_price: number;
    price_per_night: number;
  };
  payments: Payment[];
  status: BookingStatus;
}

export interface CreateBookingRequest {
  hotel_id: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  special_requests?: string;
}
