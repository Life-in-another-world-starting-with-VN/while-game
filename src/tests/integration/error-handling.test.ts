/**
 * Error Handling Integration Tests
 * 
 * Tests comprehensive error handling across the v2 API integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '../../services/api';
import {
  GameErrorCode,
  GameStateError,
  handleApiError,
  validateSceneData,
  validateSessionData,
  createInvalidSceneTypeError,
  createMissingSessionError,
  retryWithBackoff,
  requiresReauth,
} from '../../utils/errorHandler';

describe('Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Network Failure Scenarios', () => {
    it('should handle network timeout', () => {
      const error = new ApiError('Network timeout');
      const message = handleApiError(error);
      expect(message).toContain('네트워크');
    });

    it('should handle connection refused', () => {
      const error = new TypeError('fetch failed: connection refused');
      const message = handleApiError(error);
      expect(message).toContain('네트워크');
    });

    it('should retry on network failures', async () => {
      let attempts = 0;
      const fn = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new ApiError('Network failed');
        }
        return 'success';
      });

      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should give up after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new ApiError('Network failed'));
      
      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Authentication Failure Scenarios', () => {
    it('should handle 401 unauthorized', () => {
      const error = new ApiError('Unauthorized', 401);
      const message = handleApiError(error);
      expect(message).toContain('인증');
      expect(requiresReauth(error)).toBe(true);
    });

    it('should handle 403 forbidden', () => {
      const error = new ApiError('Forbidden', 403);
      const message = handleApiError(error);
      expect(message).toContain('인증');
      expect(requiresReauth(error)).toBe(true);
    });

    it('should not retry on auth errors', async () => {
      const fn = vi.fn().mockRejectedValue(new ApiError('Unauthorized', 401));
      
      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Invalid Scene Type Scenarios', () => {
    it('should detect invalid scene type', () => {
      const scene = {
        scene_id: 1,
        type: 'invalid_type',
        role: 'narrator',
      };
      expect(validateSceneData(scene)).toBe(false);
    });

    it('should create appropriate error for invalid scene type', () => {
      const error = createInvalidSceneTypeError('unknown');
      expect(error).toBeInstanceOf(GameStateError);
      expect(error.code).toBe(GameErrorCode.INVALID_SCENE_TYPE);
      expect(error.message).toContain('unknown');
    });

    it('should handle missing type field', () => {
      const scene = {
        scene_id: 1,
        role: 'narrator',
      };
      expect(validateSceneData(scene)).toBe(false);
    });
  });

  describe('Missing Session Data Scenarios', () => {
    it('should detect missing session_id', () => {
      const session = {
        content: 'Content',
        scenes: [
          {
            scene_id: 1,
            type: 'dialogue',
            role: 'narrator',
          },
        ],
      };
      expect(validateSessionData(session)).toBe(false);
    });

    it('should detect empty scenes array', () => {
      const session = {
        session_id: 1,
        content: 'Content',
        scenes: [],
      };
      expect(validateSessionData(session)).toBe(false);
    });

    it('should create appropriate error for missing session', () => {
      const error = createMissingSessionError();
      expect(error).toBeInstanceOf(GameStateError);
      expect(error.code).toBe(GameErrorCode.MISSING_SESSION);
    });

    it('should detect invalid scene in session', () => {
      const session = {
        session_id: 1,
        content: 'Content',
        scenes: [
          {
            scene_id: 1,
            type: 'invalid',
          },
        ],
      };
      expect(validateSessionData(session)).toBe(false);
    });
  });

  describe('Server Error Scenarios', () => {
    it('should handle 500 internal server error', () => {
      const error = new ApiError('Internal Server Error', 500);
      const message = handleApiError(error);
      expect(message).toContain('서버');
    });

    it('should handle 502 bad gateway', () => {
      const error = new ApiError('Bad Gateway', 502);
      const message = handleApiError(error);
      expect(message).toContain('서버');
    });

    it('should handle 503 service unavailable', () => {
      const error = new ApiError('Service Unavailable', 503);
      const message = handleApiError(error);
      expect(message).toContain('서버');
    });

    it('should retry on server errors', async () => {
      let attempts = 0;
      const fn = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new ApiError('Server Error', 500);
        }
        return 'success';
      });

      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });
  });

  describe('Validation Error Scenarios', () => {
    it('should handle 422 validation error', () => {
      const error = new ApiError('Validation failed', 422);
      const message = handleApiError(error);
      expect(message).toContain('입력 데이터');
    });

    it('should handle 400 bad request', () => {
      const error = new ApiError('Bad request', 400);
      const message = handleApiError(error);
      expect(message).toContain('입력 데이터');
    });

    it('should not retry on validation errors', async () => {
      const fn = vi.fn().mockRejectedValue(new ApiError('Validation failed', 422));
      
      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scene Data Validation Edge Cases', () => {
    it('should validate dialogue scene with null dialogue', () => {
      const scene = {
        scene_id: 1,
        type: 'dialogue',
        role: 'narrator',
        dialogue: null,
      };
      expect(validateSceneData(scene)).toBe(true);
    });

    it('should reject dialogue scene with non-string dialogue', () => {
      const scene = {
        scene_id: 1,
        type: 'dialogue',
        role: 'narrator',
        dialogue: 123,
      };
      expect(validateSceneData(scene)).toBe(false);
    });

    it('should validate selections scene with empty selections object', () => {
      const scene = {
        scene_id: 1,
        type: 'selections',
        role: 'player',
        selections: {},
      };
      expect(validateSceneData(scene)).toBe(true);
    });

    it('should reject selections scene with null selections', () => {
      const scene = {
        scene_id: 1,
        type: 'selections',
        role: 'player',
        selections: null,
      };
      expect(validateSceneData(scene)).toBe(false);
    });
  });

  describe('Complex Error Scenarios', () => {
    it('should handle malformed JSON response', () => {
      const error = new ApiError('Unexpected token in JSON');
      const message = handleApiError(error);
      expect(message).toBeDefined();
      expect(typeof message).toBe('string');
    });

    it('should handle CORS errors', () => {
      const error = new TypeError('Failed to fetch');
      const message = handleApiError(error);
      expect(message).toContain('네트워크');
    });

    it('should handle unknown error types', () => {
      const error = new Error('Unknown error');
      const message = handleApiError(error);
      expect(message).toBeDefined();
      expect(typeof message).toBe('string');
    });

    it('should handle null/undefined errors gracefully', () => {
      const message1 = handleApiError(null);
      const message2 = handleApiError(undefined);
      expect(message1).toBeDefined();
      expect(message2).toBeDefined();
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should provide Korean error messages', () => {
      const errors = [
        new ApiError('Network failed'),
        new ApiError('Unauthorized', 401),
        new ApiError('Validation failed', 422),
        new ApiError('Server error', 500),
      ];

      errors.forEach(error => {
        const message = handleApiError(error);
        // Check that message contains Korean characters
        expect(/[가-힣]/.test(message)).toBe(true);
      });
    });

    it('should provide actionable error messages', () => {
      const networkError = handleApiError(new ApiError('Network failed'));
      expect(networkError).toContain('연결');

      const authError = handleApiError(new ApiError('Unauthorized', 401));
      expect(authError).toContain('로그인');

      const serverError = handleApiError(new ApiError('Server error', 500));
      expect(serverError).toContain('다시 시도');
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should implement exponential backoff', async () => {
      let attempts = 0;

      const fn = vi.fn(async () => {
        attempts++;
        if (attempts < 4) {
          throw new ApiError('Network failed');
        }
        return 'success';
      });

      const startTime = Date.now();
      await retryWithBackoff(fn, 4, 100);
      const totalTime = Date.now() - startTime;

      // Should take at least 100 + 200 + 400 = 700ms
      expect(totalTime).toBeGreaterThanOrEqual(600);
    });

    it('should not delay after last failed attempt', async () => {
      const fn = vi.fn().mockRejectedValue(new ApiError('Network failed'));

      const startTime = Date.now();
      await expect(retryWithBackoff(fn, 3, 100)).rejects.toThrow();
      const totalTime = Date.now() - startTime;

      // Should take approximately 100 + 200 = 300ms (no delay after 3rd attempt)
      expect(totalTime).toBeLessThan(500);
    });
  });
});
