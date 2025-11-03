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
