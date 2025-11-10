/**
 * Error Handler Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { ApiError } from '../services/api';
import {
  GameErrorCode,
  GameStateError,
  getErrorMessage,
  classifyApiError,
  handleApiError,
  validateSceneData,
  validateSessionData,
  validateEmotionData,
  createInvalidSceneTypeError,
  createMissingSessionError,
  createInvalidSceneError,
  createInvalidChoiceError,
  retryWithBackoff,
  isRecoverableError,
  requiresReauth,
} from './errorHandler';

describe('errorHandler', () => {
  describe('GameStateError', () => {
    it('should create error with code and message', () => {
      const error = new GameStateError('Test error', GameErrorCode.INVALID_SCENE);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(GameErrorCode.INVALID_SCENE);
      expect(error.name).toBe('GameStateError');
    });

    it('should store original error', () => {
      const originalError = new Error('Original');
      const error = new GameStateError('Test error', GameErrorCode.NETWORK_ERROR, originalError);
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly message for each error code', () => {
      expect(getErrorMessage(GameErrorCode.INVALID_SCENE)).toContain('유효하지 않은 씬');
      expect(getErrorMessage(GameErrorCode.MISSING_SESSION)).toContain('세션 데이터');
      expect(getErrorMessage(GameErrorCode.NETWORK_ERROR)).toContain('네트워크');
      expect(getErrorMessage(GameErrorCode.AUTH_ERROR)).toContain('인증');
      expect(getErrorMessage(GameErrorCode.SERVER_ERROR)).toContain('서버');
    });
  });

  describe('classifyApiError', () => {
    it('should classify network errors (no status)', () => {
      const error = new ApiError('Network failed');
      expect(classifyApiError(error)).toBe(GameErrorCode.NETWORK_ERROR);
    });

    it('should classify 401 as auth error', () => {
      const error = new ApiError('Unauthorized', 401);
      expect(classifyApiError(error)).toBe(GameErrorCode.AUTH_ERROR);
    });

    it('should classify 403 as auth error', () => {
      const error = new ApiError('Forbidden', 403);
      expect(classifyApiError(error)).toBe(GameErrorCode.AUTH_ERROR);
    });

    it('should classify 422 as validation error', () => {
      const error = new ApiError('Validation failed', 422);
      expect(classifyApiError(error)).toBe(GameErrorCode.VALIDATION_ERROR);
    });

    it('should classify 400 as validation error', () => {
      const error = new ApiError('Bad request', 400);
      expect(classifyApiError(error)).toBe(GameErrorCode.VALIDATION_ERROR);
    });

    it('should classify 500+ as server error', () => {
      const error = new ApiError('Internal error', 500);
      expect(classifyApiError(error)).toBe(GameErrorCode.SERVER_ERROR);
    });

    it('should classify TypeError with fetch as network error', () => {
      const error = new TypeError('fetch failed');
      expect(classifyApiError(error)).toBe(GameErrorCode.NETWORK_ERROR);
    });

    it('should classify unknown errors', () => {
      const error = new Error('Unknown');
      expect(classifyApiError(error)).toBe(GameErrorCode.UNKNOWN_ERROR);
    });
  });

  describe('handleApiError', () => {
    it('should return user-friendly message for API errors', () => {
      const error = new ApiError('Unauthorized', 401);
      const message = handleApiError(error);
      expect(message).toContain('인증');
    });

    it('should handle network errors', () => {
      const error = new ApiError('Network failed');
      const message = handleApiError(error);
      expect(message).toContain('네트워크');
    });
  });

  describe('validateSceneData', () => {
    it('should validate valid dialogue scene', () => {
      const scene = {
        scene_id: 1,
        type: 'dialogue',
        role: 'narrator',
        dialogue: 'Hello',
        character_filename: null,
      };
      expect(validateSceneData(scene)).toBe(true);
    });

    it('should validate valid selections scene', () => {
      const scene = {
        scene_id: 2,
        type: 'selections',
        role: 'player',
        selections: { '1': 'Choice 1', '2': 'Choice 2' },
        character_filename: 'char1.png',
      };
      expect(validateSceneData(scene)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(validateSceneData(null)).toBe(false);
      expect(validateSceneData(undefined)).toBe(false);
    });

    it('should reject non-object', () => {
      expect(validateSceneData('string')).toBe(false);
      expect(validateSceneData(123)).toBe(false);
    });

    it('should reject missing scene_id', () => {
      const scene = {
        type: 'dialogue',
        role: 'narrator',
      };
      expect(validateSceneData(scene)).toBe(false);
    });

    it('should reject invalid scene_id type', () => {
      const scene = {
        scene_id: '1',
        type: 'dialogue',
        role: 'narrator',
      };
      expect(validateSceneData(scene)).toBe(false);
    });

    it('should reject missing type', () => {
      const scene = {
        scene_id: 1,
        role: 'narrator',
      };
      expect(validateSceneData(scene)).toBe(false);
    });

    it('should reject invalid type', () => {
      const scene = {
        scene_id: 1,
        type: 'invalid',
        role: 'narrator',
      };
      expect(validateSceneData(scene)).toBe(false);
    });

    it('should reject dialogue scene with invalid dialogue type', () => {
      const scene = {
        scene_id: 1,
        type: 'dialogue',
        role: 'narrator',
        dialogue: 123,
      };
      expect(validateSceneData(scene)).toBe(false);
    });

    it('should reject selections scene without selections', () => {
      const scene = {
        scene_id: 1,
        type: 'selections',
        role: 'player',
      };
      expect(validateSceneData(scene)).toBe(false);
    });

    it('should reject selections scene with invalid selections type', () => {
      const scene = {
        scene_id: 1,
        type: 'selections',
        role: 'player',
        selections: 'invalid',
      };
      expect(validateSceneData(scene)).toBe(false);
    });
  });

  describe('validateSessionData', () => {
    it('should validate valid session', () => {
      const session = {
        session_id: 1,
        content: 'Session content',
        scenes: [
          {
            scene_id: 1,
            type: 'dialogue',
            role: 'narrator',
            dialogue: 'Hello',
          },
        ],
      };
      expect(validateSessionData(session)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(validateSessionData(null)).toBe(false);
      expect(validateSessionData(undefined)).toBe(false);
    });

    it('should reject missing session_id', () => {
      const session = {
        content: 'Content',
        scenes: [],
      };
      expect(validateSessionData(session)).toBe(false);
    });

    it('should reject invalid session_id type', () => {
      const session = {
        session_id: '1',
        content: 'Content',
        scenes: [],
      };
      expect(validateSessionData(session)).toBe(false);
    });

    it('should reject missing scenes', () => {
      const session = {
        session_id: 1,
        content: 'Content',
      };
      expect(validateSessionData(session)).toBe(false);
    });

    it('should reject non-array scenes', () => {
      const session = {
        session_id: 1,
        content: 'Content',
        scenes: 'invalid',
      };
      expect(validateSessionData(session)).toBe(false);
    });

    it('should reject empty scenes array', () => {
      const session = {
        session_id: 1,
        content: 'Content',
        scenes: [],
      };
      expect(validateSessionData(session)).toBe(false);
    });

    it('should reject session with invalid scene', () => {
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

  describe('validateEmotionData', () => {
    it('should validate valid emotion data', () => {
      const emotion = {
        angry: 10,
        disgust: 20,
        fear: 30,
        happy: 40,
        sad: 50,
        surprise: 60,
        neutral: 70,
      };
      expect(validateEmotionData(emotion)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(validateEmotionData(null)).toBe(false);
      expect(validateEmotionData(undefined)).toBe(false);
    });

    it('should reject missing fields', () => {
      const emotion = {
        angry: 10,
        disgust: 20,
      };
      expect(validateEmotionData(emotion)).toBe(false);
    });

    it('should reject non-number values', () => {
      const emotion = {
        angry: '10',
        disgust: 20,
        fear: 30,
        happy: 40,
        sad: 50,
        surprise: 60,
        neutral: 70,
      };
      expect(validateEmotionData(emotion)).toBe(false);
    });

    it('should reject values below 0', () => {
      const emotion = {
        angry: -1,
        disgust: 20,
        fear: 30,
        happy: 40,
        sad: 50,
        surprise: 60,
        neutral: 70,
      };
      expect(validateEmotionData(emotion)).toBe(false);
    });

    it('should reject values above 100', () => {
      const emotion = {
        angry: 10,
        disgust: 20,
        fear: 30,
        happy: 101,
        sad: 50,
        surprise: 60,
        neutral: 70,
      };
      expect(validateEmotionData(emotion)).toBe(false);
    });
  });

  describe('error factory functions', () => {
    it('should create invalid scene type error', () => {
      const error = createInvalidSceneTypeError('unknown');
      expect(error).toBeInstanceOf(GameStateError);
      expect(error.code).toBe(GameErrorCode.INVALID_SCENE_TYPE);
      expect(error.message).toContain('unknown');
    });

    it('should create missing session error', () => {
      const error = createMissingSessionError();
      expect(error).toBeInstanceOf(GameStateError);
      expect(error.code).toBe(GameErrorCode.MISSING_SESSION);
    });

    it('should create invalid scene error', () => {
      const error = createInvalidSceneError();
      expect(error).toBeInstanceOf(GameStateError);
      expect(error.code).toBe(GameErrorCode.INVALID_SCENE);
    });

    it('should create invalid choice error', () => {
      const error = createInvalidChoiceError(99);
      expect(error).toBeInstanceOf(GameStateError);
      expect(error.code).toBe(GameErrorCode.INVALID_CHOICE);
      expect(error.message).toContain('99');
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new ApiError('Network failed'))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on server error', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new ApiError('Server error', 500))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on auth error', async () => {
      const fn = vi.fn().mockRejectedValue(new ApiError('Unauthorized', 401));
      
      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new ApiError('Network failed'));
      
      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('isRecoverableError', () => {
    it('should return true for network errors', () => {
      const error = new ApiError('Network failed');
      expect(isRecoverableError(error)).toBe(true);
    });

    it('should return true for server errors', () => {
      const error = new ApiError('Server error', 500);
      expect(isRecoverableError(error)).toBe(true);
    });

    it('should return false for auth errors', () => {
      const error = new ApiError('Unauthorized', 401);
      expect(isRecoverableError(error)).toBe(false);
    });

    it('should return false for validation errors', () => {
      const error = new ApiError('Validation failed', 422);
      expect(isRecoverableError(error)).toBe(false);
    });
  });

  describe('requiresReauth', () => {
    it('should return true for 401 errors', () => {
      const error = new ApiError('Unauthorized', 401);
      expect(requiresReauth(error)).toBe(true);
    });

    it('should return true for 403 errors', () => {
      const error = new ApiError('Forbidden', 403);
      expect(requiresReauth(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new ApiError('Server error', 500);
      expect(requiresReauth(error)).toBe(false);
    });
  });
});
