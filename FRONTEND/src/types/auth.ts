export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface Permission {
  code: string;
  module: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: Permission[];
}

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  user: AuthUser;
}
