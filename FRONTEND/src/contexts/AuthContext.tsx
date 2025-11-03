import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axiosInstance, { publicAxios } from "@/api/axiosInstance";
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "@/types/auth";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get("/me");
      setUser(response.data);
    } catch (error) {
      // Nếu vào đây nghĩa là request /me thất bại ngay cả sau khi interceptor đã cố gắng refresh token
      localStorage.removeItem("access_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await publicAxios.post<AuthResponse>(
        "/auth/login",
        credentials,
      );
      const { access_token, user: userData } = response.data;
      localStorage.setItem("access_token", access_token);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await publicAxios.post("/auth/register", data);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      window.location.href = "/login";
    }
  };

  const logoutAll = async () => {
    try {
      await axiosInstance.post("/auth/logout-all");
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      window.location.href = "/login";
    }
  };

  const hasPermission = (code: string): boolean => {
    if (!user) return false;
    return user.permissions.some((p) => p.code === code);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        logoutAll,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
