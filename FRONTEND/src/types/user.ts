export interface UserRole {
  id: string;
  name: string;
}

export interface UsersListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  roles: UserRole[];
  created_at: string;
}

export interface AdminUserStats {
  total_bookings: number;
  total_spent: number;
  last_booking_at: string | null;
  avg_rating_given: number;
}

export interface AdminUserDetail extends UsersListItem {
  stats: AdminUserStats;
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

