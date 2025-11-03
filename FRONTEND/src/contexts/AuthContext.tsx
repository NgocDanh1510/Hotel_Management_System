import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import axiosInstance, { publicAxios } from "../api/axiosInstance";
import type {
  AuthResponse,
  AuthUser,
  RegisterRequest,
} from "../types/auth";
import type { ApiResponse } from "../types/common";

const ACCESS_TOKEN_KEY = "access_token";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type RegisterResult =
  | { success: true; message: string }
  | { success: false; error: string };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  hasRole: (role: string) => boolean;
}

interface RefreshResponse {
  access_token: string;
  expires_in?: number;
  user?: AuthUser;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function unwrapResponseData<T>(payload: ApiResponse<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    "statusCode" in payload &&
    "message" in payload
  ) {
    return payload.data;
  }

  return payload as T;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await publicAxios.get<ApiResponse<AuthUser> | AuthUser>(
    "/me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return unwrapResponseData(response.data);
}

async function refreshAccessToken(): Promise<RefreshResponse> {
  const response = await publicAxios.post<
    ApiResponse<RefreshResponse> | RefreshResponse
  >("/auth/refresh", {});

  return unwrapResponseData(response.data);
}

function redirectToLogin() {
  window.location.assign("/login");
}

function clearStoredToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const setAuthenticatedUser = (user: AuthUser | null) => {
    setState({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
    });
  };

  const resetAuthState = () => {
    clearStoredToken();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);

      if (!token) {
        if (isMounted) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
        return;
      }

      try {
        const user = await fetchCurrentUser(token);

        if (isMounted) {
          setAuthenticatedUser(user);
        }
        return;
      } catch {
        try {
          const refreshed = await refreshAccessToken();
          localStorage.setItem(ACCESS_TOKEN_KEY, refreshed.access_token);

          const user =
            refreshed.user ?? (await fetchCurrentUser(refreshed.access_token));

          if (isMounted) {
            setAuthenticatedUser(user);
          }
          return;
        } catch {
          if (isMounted) {
            resetAuthState();
          } else {
            clearStoredToken();
          }
        }
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setState((current) => ({
      ...current,
      isLoading: true,
    }));

    try {
      const response = await publicAxios.post<
        ApiResponse<AuthResponse> | AuthResponse
      >("/auth/login", {
        email,
        password,
      });

      const authPayload = unwrapResponseData(response.data);
      localStorage.setItem(ACCESS_TOKEN_KEY, authPayload.access_token);

      const user =
        authPayload.user ?? (await fetchCurrentUser(authPayload.access_token));

      setAuthenticatedUser(user);
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
      }));
      throw error;
    }
  };

  const register = async (data: RegisterRequest): Promise<RegisterResult> => {
    setState((current) => ({
      ...current,
      isLoading: true,
    }));

    try {
      const response = await publicAxios.post<
        ApiResponse<unknown> | { message?: string }
      >("/auth/register", data);

      const payload = response.data;
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Registration successful";

      setState((current) => ({
        ...current,
        isLoading: false,
      }));

      return { success: true, message };
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
      }));

      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } finally {
      resetAuthState();
      redirectToLogin();
    }
  };

  const logoutAll = async () => {
    try {
      await axiosInstance.post("/auth/logout-all");
    } finally {
      resetAuthState();
      redirectToLogin();
    }
  };

  const hasPermission = (code: string) =>
    state.user?.permissions.some((permission) => permission.code === code) ??
    false;

  const hasRole = (role: string) => state.user?.roles.includes(role) ?? false;

  return (
    <AuthContext.Provider
      value={{
        ...state,
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
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
