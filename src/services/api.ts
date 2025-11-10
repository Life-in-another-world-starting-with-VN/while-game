// API Base Configuration and HTTP Client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(
    message: string,
    status?: number,
    data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  token?: string | null;
}

/**
 * Core API request handler with authentication
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body, token } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add Bearer token if provided
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestInit);

    let data: unknown = null;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        // Response body is not JSON
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      if (data && typeof data === 'object') {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map(item =>
            typeof item === 'object' && item !== null && 'msg' in item
              ? String(item.msg)
              : String(item)
          ).join(', ');
        }
      }

      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
      undefined,
      error
    );
  }
}

export { API_BASE_URL };
