/**
 * Error Handler Utility
 * 
 * Provides centralized error handling with user-friendly messages
 * for various error scenarios in the v2 API integration.
 */

import { ApiError } from '../services/api';

/**
 * Error types for game state errors
 */
export const GameErrorCode = {
  INVALID_SCENE: 'INVALID_SCENE',
  MISSING_SESSION: 'MISSING_SESSION',
  INVALID_CHOICE: 'INVALID_CHOICE',
  INVALID_SCENE_TYPE: 'INVALID_SCENE_TYPE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type GameErrorCode = typeof GameErrorCode[keyof typeof GameErrorCode];

/**
 * Custom error class for game state errors
 */
export class GameStateError extends Error {
  code: GameErrorCode;
  originalError?: unknown;

  constructor(message: string, code: GameErrorCode, originalError?: unknown) {
    super(message);
    this.name = 'GameStateError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * User-friendly error messages mapped to error codes
 */
const ERROR_MESSAGES: Record<GameErrorCode, string> = {
  [GameErrorCode.INVALID_SCENE]: '유효하지 않은 씬입니다. 게임을 다시 시작해주세요.',
  [GameErrorCode.MISSING_SESSION]: '세션 데이터를 찾을 수 없습니다. 게임을 다시 시작해주세요.',
  [GameErrorCode.INVALID_CHOICE]: '유효하지 않은 선택입니다. 다시 선택해주세요.',
  [GameErrorCode.INVALID_SCENE_TYPE]: '알 수 없는 씬 타입입니다. 게임을 다시 시작해주세요.',
  [GameErrorCode.NETWORK_ERROR]: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.',
  [GameErrorCode.AUTH_ERROR]: '인증에 실패했습니다. 다시 로그인해주세요.',
  [GameErrorCode.VALIDATION_ERROR]: '입력 데이터가 올바르지 않습니다. 다시 시도해주세요.',
  [GameErrorCode.SERVER_ERROR]: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [GameErrorCode.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.',
};

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(code: GameErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[GameErrorCode.UNKNOWN_ERROR];
}

/**
 * Classify API error and return appropriate error code
 */
export function classifyApiError(error: unknown): GameErrorCode {
  if (error instanceof ApiError) {
    // Network errors (no status code)
    if (!error.status) {
      return GameErrorCode.NETWORK_ERROR;
    }

    // Authentication errors
    if (error.status === 401 || error.status === 403) {
      return GameErrorCode.AUTH_ERROR;
    }

    // Validation errors
    if (error.status === 422 || error.status === 400) {
      return GameErrorCode.VALIDATION_ERROR;
    }

    // Server errors
    if (error.status >= 500) {
      return GameErrorCode.SERVER_ERROR;
    }
  }

  // Network errors (fetch failures)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return GameErrorCode.NETWORK_ERROR;
  }

  return GameErrorCode.UNKNOWN_ERROR;
}

/**
 * Handle API errors and convert to user-friendly messages
 */
export function handleApiError(error: unknown): string {
  const errorCode = classifyApiError(error);
  return getErrorMessage(errorCode);
}

/**
 * Validate scene data structure
 */
export function validateSceneData(scene: unknown): boolean {
  if (!scene || typeof scene !== 'object') {
    return false;
  }

  const sceneObj = scene as Record<string, unknown>;

  // Required fields
  if (typeof sceneObj.scene_id !== 'number') {
    return false;
  }

  if (typeof sceneObj.type !== 'string') {
    return false;
  }

  if (sceneObj.type !== 'dialogue' && sceneObj.type !== 'selection' && sceneObj.type !== 'selections') {
    return false;
  }

  // Type-specific validation
  if (sceneObj.type === 'dialogue') {
    // Dialogue scenes should have dialogue text (can be null or string)
    if (sceneObj.dialogue !== null && sceneObj.dialogue !== undefined && typeof sceneObj.dialogue !== 'string') {
      return false;
    }
  }

  if (sceneObj.type === 'selection' || sceneObj.type === 'selections') {
    // Selection scenes should have selections object
    if (!sceneObj.selections || typeof sceneObj.selections !== 'object') {
      return false;
    }
    // Selection 타입은 dialogue가 없어도 됨 (직전 화면 위에 선택지 표시)
  }

  // character_filename은 선택적 필드
  if (sceneObj.character_filename !== null && 
      sceneObj.character_filename !== undefined && 
      typeof sceneObj.character_filename !== 'string') {
    return false;
  }

  return true;
}

/**
 * Validate session data structure
 */
export function validateSessionData(session: unknown): boolean {
  if (!session || typeof session !== 'object') {
    return false;
  }

  const sessionObj = session as Record<string, unknown>;

  // Required fields
  if (typeof sessionObj.session_id !== 'number') {
    return false;
  }

  if (!Array.isArray(sessionObj.scenes)) {
    return false;
  }

  if (sessionObj.scenes.length === 0) {
    return false;
  }

  // Validate all scenes
  return sessionObj.scenes.every(validateSceneData);
}

/**
 * Validate emotion data structure
 */
export function validateEmotionData(emotion: unknown): boolean {
  if (!emotion || typeof emotion !== 'object') {
    return false;
  }

  const emotionObj = emotion as Record<string, unknown>;

  const requiredFields = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'];

  for (const field of requiredFields) {
    const value = emotionObj[field];
    if (typeof value !== 'number' || value < 0 || value > 100) {
      return false;
    }
  }

  return true;
}

/**
 * Create a GameStateError for invalid scene type
 */
export function createInvalidSceneTypeError(sceneType: string): GameStateError {
  return new GameStateError(
    `Invalid scene type: ${sceneType}. Expected 'dialogue' or 'selections'.`,
    GameErrorCode.INVALID_SCENE_TYPE
  );
}

/**
 * Create a GameStateError for missing session data
 */
export function createMissingSessionError(): GameStateError {
  return new GameStateError(
    'Session data is missing or invalid.',
    GameErrorCode.MISSING_SESSION
  );
}

/**
 * Create a GameStateError for invalid scene data
 */
export function createInvalidSceneError(): GameStateError {
  return new GameStateError(
    'Scene data is invalid or corrupted.',
    GameErrorCode.INVALID_SCENE
  );
}

/**
 * Create a GameStateError for invalid choice
 */
export function createInvalidChoiceError(selectionId: number): GameStateError {
  return new GameStateError(
    `Invalid selection ID: ${selectionId}`,
    GameErrorCode.INVALID_CHOICE
  );
}

/**
 * Retry logic for network failures
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on network errors
      const errorCode = classifyApiError(error);
      if (errorCode !== GameErrorCode.NETWORK_ERROR && errorCode !== GameErrorCode.SERVER_ERROR) {
        throw error;
      }

      // Don't wait after the last attempt
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Check if error is recoverable (can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  const errorCode = classifyApiError(error);
  return errorCode === GameErrorCode.NETWORK_ERROR || errorCode === GameErrorCode.SERVER_ERROR;
}

/**
 * Check if error requires re-authentication
 */
export function requiresReauth(error: unknown): boolean {
  const errorCode = classifyApiError(error);
  return errorCode === GameErrorCode.AUTH_ERROR;
}
