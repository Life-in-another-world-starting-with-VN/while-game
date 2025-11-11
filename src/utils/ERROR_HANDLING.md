# Error Handling Guide

This document describes the comprehensive error handling system implemented for the v2 API integration.

## Overview

The error handling system provides:
- User-friendly Korean error messages
- Automatic retry logic for recoverable errors
- Validation of API responses
- Centralized error classification
- Type-safe error handling

## Error Types

### GameErrorCode

All errors are classified into the following categories:

| Error Code | Description | User Message | Recoverable |
|------------|-------------|--------------|-------------|
| `INVALID_SCENE` | Scene data is invalid or corrupted | 유효하지 않은 씬입니다. 게임을 다시 시작해주세요. | No |
| `MISSING_SESSION` | Session data is missing or invalid | 세션 데이터를 찾을 수 없습니다. 게임을 다시 시작해주세요. | No |
| `INVALID_CHOICE` | User selected an invalid choice | 유효하지 않은 선택입니다. 다시 선택해주세요. | No |
| `INVALID_SCENE_TYPE` | Unknown scene type encountered | 알 수 없는 씬 타입입니다. 게임을 다시 시작해주세요. | No |
| `NETWORK_ERROR` | Network connection failed | 네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요. | Yes |
| `AUTH_ERROR` | Authentication failed (401, 403) | 인증에 실패했습니다. 다시 로그인해주세요. | No |
| `VALIDATION_ERROR` | Request validation failed (400, 422) | 입력 데이터가 올바르지 않습니다. 다시 시도해주세요. | No |
| `SERVER_ERROR` | Server error (500+) | 서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요. | Yes |
| `UNKNOWN_ERROR` | Unclassified error | 알 수 없는 오류가 발생했습니다. 다시 시도해주세요. | No |

## Core Functions

### Error Classification

```typescript
import { classifyApiError, handleApiError } from '../utils/errorHandler';

try {
  await someApiCall();
} catch (error) {
  // Get error code
  const errorCode = classifyApiError(error);
  
  // Get user-friendly message
  const message = handleApiError(error);
  console.error(message);
}
```

### Retry Logic

The `retryWithBackoff` function automatically retries failed requests with exponential backoff:

```typescript
import { retryWithBackoff } from '../utils/errorHandler';

// Retry up to 3 times with 1 second initial delay
const result = await retryWithBackoff(
  () => createGame(data, token),
  3,  // maxRetries
  1000  // initialDelay in ms
);
```

**Retry Behavior:**
- Only retries on `NETWORK_ERROR` and `SERVER_ERROR`
- Uses exponential backoff: 1s, 2s, 4s, 8s, etc.
- Does not retry on auth or validation errors
- Throws the last error after max retries

### Data Validation

Validate API responses before using them:

```typescript
import {
  validateSceneData,
  validateSessionData,
  validateEmotionData,
} from '../utils/errorHandler';

// Validate scene
if (!validateSceneData(scene)) {
  throw createInvalidSceneError();
}

// Validate session
if (!validateSessionData(session)) {
  throw createMissingSessionError();
}

// Validate emotion data
if (!validateEmotionData(emotion)) {
  // Use default emotion data
  emotion = getDefaultEmotionData();
}
```

### Error Factory Functions

Create specific error types:

```typescript
import {
  createInvalidSceneTypeError,
  createMissingSessionError,
  createInvalidSceneError,
  createInvalidChoiceError,
} from '../utils/errorHandler';

// Invalid scene type
throw createInvalidSceneTypeError('unknown_type');

// Missing session
throw createMissingSessionError();

// Invalid scene
throw createInvalidSceneError();

// Invalid choice
throw createInvalidChoiceError(selectionId);
```

## Usage in Components

### Using useGameState Hook

The `useGameState` hook automatically handles errors:

```typescript
import { useGameState } from '../hooks/useGameState';

function GameComponent() {
  const { gameState, createNewGame, proceedToNextScene } = useGameState();
  
  // Error is stored in gameState.error
  if (gameState.error) {
    return <ErrorMessage message={gameState.error} />;
  }
  
  // Loading state
  if (gameState.isLoading) {
    return <LoadingSpinner />;
  }
  
  // Normal rendering
  return <GameContent />;
}
```

### Manual Error Handling

For custom error handling:

```typescript
import { handleApiError, isRecoverableError } from '../utils/errorHandler';

async function handleGameAction() {
  try {
    await proceedToNextScene();
  } catch (error) {
    const message = handleApiError(error);
    
    // Check if error is recoverable
    if (isRecoverableError(error)) {
      // Show retry button
      setErrorState({ message, canRetry: true });
    } else {
      // Show error without retry
      setErrorState({ message, canRetry: false });
    }
  }
}
```

### Using ErrorMessage Component

Display user-friendly error messages:

```typescript
import { ErrorMessage } from '../components/common/ErrorMessage';

function MyComponent() {
  const [error, setError] = useState<string | null>(null);
  
  return (
    <>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => {
            setError(null);
            retryAction();
          }}
          onDismiss={() => setError(null)}
        />
      )}
    </>
  );
}
```

## Error Handling Patterns

### Pattern 1: Automatic Retry with Validation

```typescript
const createNewGame = async (data: CreateGameRequest) => {
  try {
    // Retry on network/server errors
    const response = await retryWithBackoff(() => createGame(data, token));
    
    // Validate response
    if (!validateSessionData(response.sessions[0])) {
      throw createMissingSessionError();
    }
    
    // Use validated data
    setState(response);
  } catch (error) {
    // Convert to user-friendly message
    const message = handleApiError(error);
    setError(message);
    throw error;
  }
};
```

### Pattern 2: Scene Type Validation

```typescript
const proceedToNextScene = async () => {
  const currentScene = getCurrentScene();
  
  // Validate scene type before API call
  if (currentScene?.type !== 'dialogue') {
    throw createInvalidSceneTypeError(currentScene?.type || 'unknown');
  }
  
  try {
    const response = await generateNextScene(...);
    
    // Validate response scenes
    if (!response.scenes.every(validateSceneData)) {
      throw createInvalidSceneError();
    }
    
    setState(response);
  } catch (error) {
    setError(handleApiError(error));
    throw error;
  }
};
```

### Pattern 3: Choice Validation

```typescript
const selectChoice = async (selectionId: number) => {
  const currentScene = getCurrentScene();
  
  // Validate scene type
  if (currentScene?.type !== 'selections') {
    throw createInvalidSceneTypeError(currentScene?.type || 'unknown');
  }
  
  // Validate selection exists
  if (!currentScene.selections?.[selectionId]) {
    throw createInvalidChoiceError(selectionId);
  }
  
  try {
    const response = await generateSceneAfterSelection(...);
    setState(response);
  } catch (error) {
    setError(handleApiError(error));
    throw error;
  }
};
```

## Testing Error Handling

### Unit Tests

Test individual error handling functions:

```typescript
import { describe, it, expect } from 'vitest';
import { classifyApiError, GameErrorCode } from './errorHandler';

describe('Error Classification', () => {
  it('should classify 401 as auth error', () => {
    const error = new ApiError('Unauthorized', 401);
    expect(classifyApiError(error)).toBe(GameErrorCode.AUTH_ERROR);
  });
});
```

### Integration Tests

Test error handling in realistic scenarios:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { retryWithBackoff } from './errorHandler';

describe('Retry Logic', () => {
  it('should retry on network failures', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ApiError('Network failed'))
      .mockResolvedValue('success');
    
    const result = await retryWithBackoff(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```

## Best Practices

1. **Always validate API responses** before using them
2. **Use retry logic** for network and server errors
3. **Provide user-friendly messages** in Korean
4. **Don't retry** on auth or validation errors
5. **Log errors** for debugging but show friendly messages to users
6. **Handle edge cases** like null/undefined data
7. **Test error scenarios** thoroughly
8. **Use type-safe error handling** with TypeScript

## Common Pitfalls

### ❌ Don't do this:

```typescript
// Generic error message
catch (error) {
  alert('Error occurred');
}

// No validation
const scene = response.scenes[0];
setState(scene); // Might be undefined!

// Retry everything
await retryWithBackoff(() => login()); // Don't retry auth!
```

### ✅ Do this instead:

```typescript
// User-friendly message
catch (error) {
  const message = handleApiError(error);
  setError(message);
}

// Validate first
if (!validateSceneData(response.scenes[0])) {
  throw createInvalidSceneError();
}
setState(response.scenes[0]);

// Only retry recoverable errors
if (isRecoverableError(error)) {
  await retryWithBackoff(() => createGame());
}
```

## Debugging

Enable detailed error logging:

```typescript
try {
  await someApiCall();
} catch (error) {
  // Log full error for debugging
  console.error('API Error:', error);
  
  // Show user-friendly message
  const message = handleApiError(error);
  setError(message);
}
```

## Future Improvements

- [ ] Add error tracking/monitoring integration
- [ ] Implement circuit breaker pattern
- [ ] Add more granular error codes
- [ ] Support error recovery suggestions
- [ ] Add error analytics
