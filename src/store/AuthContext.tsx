import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthUser, AuthContextValue } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const REFRESH_ENDPOINT = `${API_BASE_URL}/api/v2/reissue`;
const REFRESH_STORAGE_KEY = 'refresh_token';

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshWithToken = useCallback(async (refreshToken: string) => {
    const response = await fetch(REFRESH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      throw new Error('토큰 응답을 파싱하지 못했습니다.');
    }

    if (
      !response.ok ||
      !payload ||
      typeof payload !== 'object' ||
      typeof (payload as { access_token?: unknown }).access_token !== 'string'
    ) {
      throw new Error('액세스 토큰 갱신에 실패했습니다.');
    }

    const data = payload as {
      access_token: string;
      refresh_token?: string;
      user?: AuthUser | null;
    };

    const nextRefreshToken = data.refresh_token ?? refreshToken;

    setState({
      accessToken: data.access_token,
      refreshToken: nextRefreshToken,
      user: data.user ?? null,
    });

    localStorage.setItem(REFRESH_STORAGE_KEY, nextRefreshToken);
    setLastError(null);

    return {
      accessToken: data.access_token,
      userId: typeof data.user?.id === 'string' ? data.user.id : undefined,
      user: data.user ?? null,
    };
  }, []);

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem(REFRESH_STORAGE_KEY);
    if (!storedRefreshToken) {
      setIsInitializing(false);
      return;
    }

    setState((prev) => ({
      ...prev,
      refreshToken: storedRefreshToken,
    }));

    refreshWithToken(storedRefreshToken)
      .catch((err: unknown) => {
        setLastError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        localStorage.removeItem(REFRESH_STORAGE_KEY);
        setState(initialState);
      })
      .finally(() => setIsInitializing(false));
  }, [refreshWithToken]);

  const refreshAccessToken = useCallback(async () => {
    if (!state.refreshToken) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      return await refreshWithToken(state.refreshToken);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      throw err;
    }
  }, [refreshWithToken, state.refreshToken]);

  const login = useCallback(
    ({ refreshToken, accessToken = null, user = null }: { refreshToken: string; accessToken?: string | null; user?: AuthUser | null }) => {
      localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
      setState({
        accessToken: accessToken ?? null,
        refreshToken,
        user: user ?? null,
      });
      setLastError(null);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(REFRESH_STORAGE_KEY);
    setState(initialState);
    setLastError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
      isAuthenticated: Boolean(state.refreshToken),
      isInitializing,
      lastError,
      login,
      logout,
      refreshAccessToken,
    }),
    [lastError, login, logout, refreshAccessToken, isInitializing, state.accessToken, state.refreshToken, state.user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
