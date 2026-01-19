export interface HotelListItem {
  id: string;
  name: string;
  slug: string;
  district?: string | null;
  city?: string | null;
  star_rating: number;
  avg_rating: number;
  review_count: number;
  min_price: number;
  primary_image_url: string | null;
}

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  district?: string | null;
  city?: string | null;
  star_rating: number;
  contact_email: string;
  contact_phone: string;
  created_at: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
}

export interface Image {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order?: number;
}

export interface RoomType {
  id: string;
  name: string;
  description?: string | null;
  max_occupancy: number;
  base_price: number;
  currency: string;
  total_rooms?: number;
  bed_type?: string;
  size_sqm?: number | null;
  images: Image[];
  amenities: Amenity[];
}

export interface RatingBreakdown {
  cleanliness: number;
  service: number;
  location: number;
}

export interface HotelDetail {
  hotel: Hotel;
  room_types: RoomType[];
  amenities: Amenity[];
  images: Image[];
  avg_rating: number;
  review_count: number;
  rating_breakdown: RatingBreakdown;
}

export interface RoomAvailability {
  room_type: RoomType & {
    hotel_id: string;
  };
  available_rooms: number;
  price: number;
}
