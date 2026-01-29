export interface AdminRoleOption {
  id: string;
  name: string;
}

export interface AdminAmenityOption {
  id: string;
  name: string;
  icon?: string | null;
}

export interface AdminCityOption {
  id: string;
  name: string;
}

export interface AdminDistrictOption {
  id: string;
  name: string;
}

export interface AdminHotelListItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  district_id: string;
  district?: string | null;
  city?: string | null;
  star_rating: number;
  contact_email?: string | null;
  contact_phone?: string | null;
  owner_id: string;
  is_active: boolean;
  status: "pending" | "approved" | "rejected";
  avg_rating?: number | null;
  review_count?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminRoomTypeListItem {
  id: string;
  name: string;
  description?: string | null;
  max_occupancy: number;
  base_price: number;
  currency: string;
  total_rooms: number;
  available_rooms_count?: number;
  bed_type?: string | null;
  size_sqm?: number | null;
  created_at?: string;
}

export interface AdminBookingListItem {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  hotel: {
    id: string;
    name: string;
  } | null;
  room: {
    id: string;
    room_number: string;
  } | null;
  room_type: {
    id: string;
    name: string;
  } | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  price_per_night: number;
  status:
    | "pending"
    | "confirmed"
    | "checked_in"
    | "checked_out"
    | "cancelled"
    | "cancellation_pending";
  special_requests?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminReviewListItem {
  id: string;
  hotel_id: string;
  user_id: string;
  rating_overall: number;
  rating_cleanliness?: number | null;
  rating_service?: number | null;
  rating_location?: number | null;
  comment?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  User?: {
    id: string;
    name: string;
    email: string;
  };
  Hotel?: {
    id: string;
    name: string;
  };
}

export interface AdminPaymentListItem {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  gateway: "vnpay" | "momo" | "stripe";
  status: "pending" | "success" | "failed" | "refunded";
  type: "deposit" | "full_payment" | "refund";
  transaction_id?: string | null;
  paid_at?: string | null;
  note?: string | null;
  created_at: string;
  User?: {
    id: string;
    name: string;
    email: string;
  };
}
