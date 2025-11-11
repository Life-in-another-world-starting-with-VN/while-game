import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signup, login, reissueToken } from './authService';
import { ApiError } from './api';
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  ReissueResponse,
} from '../types/api-v2';

// Mock the api module
vi.mock('./api', async () => {
  const actual = await vi.importActual('./api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

// Import the mocked apiRequest
import { apiRequest } from './api';
const mockApiRequest = vi.mocked(apiRequest);

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('should successfully register a new user', async () => {
      const request: SignupRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse: SignupResponse = {
        message: 'User registered successfully',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await signup(request);

      expect(mockApiRequest).toHaveBeenCalledWith('/api/v2/signup', {
        method: 'POST',
        body: request,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should handle signup with all required fields', async () => {
      const request: SignupRequest = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'securepass456',
      };

      const expectedResponse: SignupResponse = {
        message: 'Registration complete',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await signup(request);

      expect(result).toEqual(expectedResponse);
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
    });

    it('should throw ApiError when username already exists', async () => {
      const request: SignupRequest = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const error = new ApiError('Username already exists', 409);
      mockApiRequest.mockRejectedValue(error);

      await expect(signup(request)).rejects.toThrow(ApiError);
      await expect(signup(request)).rejects.toThrow('Username already exists');
    });

    it('should throw ApiError when email already exists', async () => {
      const request: SignupRequest = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const error = new ApiError('Email already registered', 409);
      mockApiRequest.mockRejectedValue(error);

      await expect(signup(request)).rejects.toThrow(ApiError);
      await expect(signup(request)).rejects.toThrow('Email already registered');
    });

    it('should throw ApiError for validation errors', async () => {
      const request: SignupRequest = {
        username: 'ab', // too short
        email: 'invalid-email',
        password: '123', // too short
      };

      const error = new ApiError('Validation failed', 422, {
        detail: [
          { msg: 'Username must be at least 3 characters' },
          { msg: 'Invalid email format' },
          { msg: 'Password must be at least 8 characters' },
        ],
      });
      mockApiRequest.mockRejectedValue(error);

      await expect(signup(request)).rejects.toThrow(ApiError);
      await expect(signup(request)).rejects.toThrow('Validation failed');
    });

    it('should throw ApiError for network errors', async () => {
      const request: SignupRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const error = new ApiError('네트워크 오류가 발생했습니다.');
      mockApiRequest.mockRejectedValue(error);

      await expect(signup(request)).rejects.toThrow(ApiError);
      await expect(signup(request)).rejects.toThrow('네트워크 오류가 발생했습니다.');
    });
  });

  describe('login', () => {
    it('should successfully authenticate user and return tokens', async () => {
      const request: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      };

      const expectedResponse: LoginResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await login(request);

      expect(mockApiRequest).toHaveBeenCalledWith('/api/v2/login', {
        method: 'POST',
        body: request,
      });
      expect(result).toEqual(expectedResponse);
      expect(result.access_token).toBeTruthy();
      expect(result.refresh_token).toBeTruthy();
    });

    it('should handle login with valid credentials', async () => {
      const request: LoginRequest = {
        username: 'validuser',
        password: 'correctpassword',
      };

      const expectedResponse: LoginResponse = {
        access_token: 'valid.access.token',
        refresh_token: 'valid.refresh.token',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await login(request);

      expect(result).toEqual(expectedResponse);
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
    });

    it('should throw ApiError for invalid credentials', async () => {
      const request: LoginRequest = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const error = new ApiError('Invalid username or password', 401);
      mockApiRequest.mockRejectedValue(error);

      await expect(login(request)).rejects.toThrow(ApiError);
      await expect(login(request)).rejects.toThrow('Invalid username or password');
    });

    it('should throw ApiError when user does not exist', async () => {
      const request: LoginRequest = {
        username: 'nonexistentuser',
        password: 'password123',
      };

      const error = new ApiError('User not found', 404);
      mockApiRequest.mockRejectedValue(error);

      await expect(login(request)).rejects.toThrow(ApiError);
      await expect(login(request)).rejects.toThrow('User not found');
    });

    it('should throw ApiError for account locked/disabled', async () => {
      const request: LoginRequest = {
        username: 'lockeduser',
        password: 'password123',
      };

      const error = new ApiError('Account is locked', 403);
      mockApiRequest.mockRejectedValue(error);

      await expect(login(request)).rejects.toThrow(ApiError);
      await expect(login(request)).rejects.toThrow('Account is locked');
    });

    it('should throw ApiError for validation errors', async () => {
      const request: LoginRequest = {
        username: '',
        password: '',
      };

      const error = new ApiError('Username and password are required', 422);
      mockApiRequest.mockRejectedValue(error);

      await expect(login(request)).rejects.toThrow(ApiError);
      await expect(login(request)).rejects.toThrow('Username and password are required');
    });

    it('should throw ApiError for network errors', async () => {
      const request: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      };

      const error = new ApiError('네트워크 오류가 발생했습니다.');
      mockApiRequest.mockRejectedValue(error);

      await expect(login(request)).rejects.toThrow(ApiError);
      await expect(login(request)).rejects.toThrow('네트워크 오류가 발생했습니다.');
    });
  });

  describe('reissueToken', () => {
    it('should successfully refresh tokens', async () => {
      const refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh';

      const expectedResponse: ReissueResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_access',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_refresh',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await reissueToken(refreshToken);

      expect(mockApiRequest).toHaveBeenCalledWith('/api/v2/reissue', {
        method: 'POST',
        body: {
          refresh_token: refreshToken,
        },
      });
      expect(result).toEqual(expectedResponse);
      expect(result.access_token).toBeTruthy();
      expect(result.refresh_token).toBeTruthy();
    });

    it('should handle token refresh with valid refresh token', async () => {
      const refreshToken = 'valid.refresh.token';

      const expectedResponse: ReissueResponse = {
        access_token: 'new.access.token',
        refresh_token: 'new.refresh.token',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await reissueToken(refreshToken);

      expect(result).toEqual(expectedResponse);
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
    });

    it('should throw ApiError for invalid refresh token', async () => {
      const refreshToken = 'invalid.refresh.token';

      const error = new ApiError('Invalid refresh token', 401);
      mockApiRequest.mockRejectedValue(error);

      await expect(reissueToken(refreshToken)).rejects.toThrow(ApiError);
      await expect(reissueToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw ApiError for expired refresh token', async () => {
      const refreshToken = 'expired.refresh.token';

      const error = new ApiError('Refresh token has expired', 401);
      mockApiRequest.mockRejectedValue(error);

      await expect(reissueToken(refreshToken)).rejects.toThrow(ApiError);
      await expect(reissueToken(refreshToken)).rejects.toThrow('Refresh token has expired');
    });

    it('should throw ApiError for revoked refresh token', async () => {
      const refreshToken = 'revoked.refresh.token';

      const error = new ApiError('Refresh token has been revoked', 401);
      mockApiRequest.mockRejectedValue(error);

      await expect(reissueToken(refreshToken)).rejects.toThrow(ApiError);
      await expect(reissueToken(refreshToken)).rejects.toThrow('Refresh token has been revoked');
    });

    it('should throw ApiError for malformed refresh token', async () => {
      const refreshToken = 'malformed-token';

      const error = new ApiError('Malformed token', 400);
      mockApiRequest.mockRejectedValue(error);

      await expect(reissueToken(refreshToken)).rejects.toThrow(ApiError);
      await expect(reissueToken(refreshToken)).rejects.toThrow('Malformed token');
    });

    it('should throw ApiError for empty refresh token', async () => {
      const refreshToken = '';

      const error = new ApiError('Refresh token is required', 422);
      mockApiRequest.mockRejectedValue(error);

      await expect(reissueToken(refreshToken)).rejects.toThrow(ApiError);
      await expect(reissueToken(refreshToken)).rejects.toThrow('Refresh token is required');
    });

    it('should throw ApiError for network errors', async () => {
      const refreshToken = 'valid.refresh.token';

      const error = new ApiError('네트워크 오류가 발생했습니다.');
      mockApiRequest.mockRejectedValue(error);

      await expect(reissueToken(refreshToken)).rejects.toThrow(ApiError);
      await expect(reissueToken(refreshToken)).rejects.toThrow('네트워크 오류가 발생했습니다.');
    });
  });

  describe('authentication flow integration', () => {
    it('should handle complete signup -> login flow', async () => {
      const signupRequest: SignupRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const signupResponse: SignupResponse = {
        message: 'User registered successfully',
      };

      mockApiRequest.mockResolvedValueOnce(signupResponse);

      const signupResult = await signup(signupRequest);
      expect(signupResult).toEqual(signupResponse);

      const loginRequest: LoginRequest = {
        username: 'newuser',
        password: 'password123',
      };

      const loginResponse: LoginResponse = {
        access_token: 'access.token',
        refresh_token: 'refresh.token',
      };

      mockApiRequest.mockResolvedValueOnce(loginResponse);

      const loginResult = await login(loginRequest);
      expect(loginResult).toEqual(loginResponse);
      expect(mockApiRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle login -> token refresh flow', async () => {
      const loginRequest: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      };

      const loginResponse: LoginResponse = {
        access_token: 'initial.access.token',
        refresh_token: 'initial.refresh.token',
      };

      mockApiRequest.mockResolvedValueOnce(loginResponse);

      const loginResult = await login(loginRequest);
      expect(loginResult).toEqual(loginResponse);

      const reissueResponse: ReissueResponse = {
        access_token: 'new.access.token',
        refresh_token: 'new.refresh.token',
      };

      mockApiRequest.mockResolvedValueOnce(reissueResponse);

      const reissueResult = await reissueToken(loginResult.refresh_token);
      expect(reissueResult).toEqual(reissueResponse);
      expect(mockApiRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('error status code handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      const request: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      };

      const error = new ApiError('Bad request', 400);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await login(request).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(400);
    });

    it('should handle 401 Unauthorized errors', async () => {
      const request: LoginRequest = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const error = new ApiError('Unauthorized', 401);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await login(request).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(401);
    });

    it('should handle 403 Forbidden errors', async () => {
      const request: LoginRequest = {
        username: 'banneduser',
        password: 'password123',
      };

      const error = new ApiError('Forbidden', 403);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await login(request).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(403);
    });

    it('should handle 404 Not Found errors', async () => {
      const request: LoginRequest = {
        username: 'nonexistent',
        password: 'password123',
      };

      const error = new ApiError('Not found', 404);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await login(request).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(404);
    });

    it('should handle 409 Conflict errors', async () => {
      const request: SignupRequest = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const error = new ApiError('Conflict', 409);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await signup(request).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(409);
    });

    it('should handle 422 Validation errors', async () => {
      const request: SignupRequest = {
        username: 'ab',
        email: 'invalid',
        password: '123',
      };

      const error = new ApiError('Validation error', 422);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await signup(request).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(422);
    });

    it('should handle 500 Internal Server errors', async () => {
      const request: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      };

      const error = new ApiError('Internal server error', 500);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await login(request).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(500);
    });

    it('should handle errors without status code', async () => {
      const request: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      };

      const error = new ApiError('Network error');
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await login(request).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBeUndefined();
    });
  });
});
