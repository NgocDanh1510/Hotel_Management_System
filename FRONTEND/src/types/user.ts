export interface UserRole {
  id: string;
  name: string;
}

export interface BookingSummary {
  total: number;
  upcoming: number;
  completed: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: UserRole[];
  booking_summary: BookingSummary;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  current_password?: string;
  new_password?: string;
}
