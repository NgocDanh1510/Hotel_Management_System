import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import authService from "@/api/authService";
import type { AuthUser, LoginRequest, RegisterRequest } from "@/types/auth";

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.refreshToken();
      localStorage.setItem("access_token", response.access_token);
      setUser(response.user);
    } catch (error) {
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
      const response = await authService.login(credentials);
      localStorage.setItem("access_token", response.access_token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await authService.register(data);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = "/login";
    }
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = "/login";
    }
  };

  const hasPermission = (code: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.some((p) => p.code === code);
  };

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
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
