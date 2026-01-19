export interface ReviewRatings {
  cleanliness?: number;
  service?: number;
  location?: number;
}

export interface ReviewUser {
  name: string;
}

export interface Review {
  id: string;
  user: ReviewUser;
  rating_overall: number;
  comment: string;
  created_at: string;
  ratings: ReviewRatings;
}

export interface CreateReviewRequest {
  booking_id: string;
  rating_overall: number;
  rating_cleanliness?: number;
  rating_service?: number;
  rating_location?: number;
  comment?: string;
}

export interface UserReview {
  id: string;
  booking_id: string;
  hotel_id: string;
  rating_overall: number;
  rating_cleanliness?: number | null;
  rating_service?: number | null;
  rating_location?: number | null;
  comment?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
  Hotel?: {
    id: string;
    name: string;
  };
  Booking?: {
    id: string;
    check_in: string;
    check_out: string;
  };
}
