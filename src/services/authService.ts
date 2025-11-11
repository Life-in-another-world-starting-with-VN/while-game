/**
 * Authentication Service (v2 API)
 * 
 * Handles user authentication operations using v2 API endpoints:
 * - /api/v2/signup - User registration
 * - /api/v2/login - User login
 * - /api/v2/reissue - Token refresh
 */

import { apiRequest } from './api';
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  ReissueRequest,
  ReissueResponse,
} from '../types/api-v2';

/**
 * Register a new user
 * 
 * @param data - User registration data (username, email, password)
 * @returns Promise with signup confirmation message
 * @throws ApiError if registration fails
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return apiRequest<SignupResponse>('/api/v2/signup', {
    method: 'POST',
    body: data,
  });
}

/**
 * Authenticate user and receive tokens
 * 
 * @param data - User login credentials (username, password)
 * @returns Promise with access_token and refresh_token
 * @throws ApiError if authentication fails
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/v2/login', {
    method: 'POST',
    body: data,
  });
}

/**
 * Refresh access token using refresh token
 * 
 * @param refreshToken - Valid refresh token
 * @returns Promise with new access_token and refresh_token
 * @throws ApiError if token refresh fails
 */
export async function reissueToken(refreshToken: string): Promise<ReissueResponse> {
  const requestBody: ReissueRequest = {
    refresh_token: refreshToken,
  };

  return apiRequest<ReissueResponse>('/api/v2/reissue', {
    method: 'POST',
    body: requestBody,
  });
}
