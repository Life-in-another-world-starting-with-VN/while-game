import { createContext } from 'react';

export interface AuthUser {
  id?: string;
  [key: string]: unknown;
}

export interface AuthContextValue {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  lastError: string | null;
  login: (params: { refreshToken: string; accessToken?: string | null; user?: AuthUser | null }) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<{ accessToken: string; userId?: string; user?: AuthUser | null }>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
