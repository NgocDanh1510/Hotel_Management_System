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
  slug: string;
}

export interface BookingRoom {
  id: string;
  room_number: string;
}

export interface BookingRoomType {
  id: string;
  name: string;
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

export interface CreateBookingRequest {
  hotel_id: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  special_requests?: string;
}
