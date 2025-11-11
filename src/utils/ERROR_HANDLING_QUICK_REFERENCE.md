# Error Handling Quick Reference

## Quick Start

### 1. Import Error Handler
```typescript
import { handleApiError } from '../utils/errorHandler';
```

### 2. Wrap API Calls
```typescript
try {
  await someApiCall();
} catch (error) {
  const message = handleApiError(error);
  setError(message);
}
```

### 3. Display Errors
```typescript
import { ErrorMessage } from '../components/common/ErrorMessage';

{error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
```

## Common Patterns

### Pattern: Retry on Network Errors
```typescript
import { retryWithBackoff } from '../utils/errorHandler';

const result = await retryWithBackoff(() => createGame(data, token));
```

### Pattern: Validate API Response
```typescript
import { validateSessionData, createMissingSessionError } from '../utils/errorHandler';

if (!validateSessionData(response.sessions[0])) {
  throw createMissingSessionError();
}
```

### Pattern: Check Scene Type
```typescript
import { createInvalidSceneTypeError } from '../utils/errorHandler';

if (scene.type !== 'dialogue') {
  throw createInvalidSceneTypeError(scene.type);
}
```

### Pattern: Validate Choice
```typescript
import { createInvalidChoiceError } from '../utils/errorHandler';

if (!scene.selections?.[selectionId]) {
  throw createInvalidChoiceError(selectionId);
}
```

## Error Messages

| Error | Korean Message |
|-------|----------------|
| Network | 네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요. |
| Auth | 인증에 실패했습니다. 다시 로그인해주세요. |
| Server | 서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요. |
| Validation | 입력 데이터가 올바르지 않습니다. 다시 시도해주세요. |
| Invalid Scene | 유효하지 않은 씬입니다. 게임을 다시 시작해주세요. |
| Missing Session | 세션 데이터를 찾을 수 없습니다. 게임을 다시 시작해주세요. |

## Validation Functions

```typescript
import {
  validateSceneData,
  validateSessionData,
  validateEmotionData,
} from '../utils/errorHandler';

// Validate scene
if (!validateSceneData(scene)) {
  // Handle invalid scene
}

// Validate session
if (!validateSessionData(session)) {
  // Handle invalid session
}

// Validate emotion
if (!validateEmotionData(emotion)) {
  // Use default emotion
}
```

## Error Classification

```typescript
import { classifyApiError, GameErrorCode } from '../utils/errorHandler';

const errorCode = classifyApiError(error);

switch (errorCode) {
  case GameErrorCode.NETWORK_ERROR:
    // Retry
    break;
  case GameErrorCode.AUTH_ERROR:
    // Redirect to login
    break;
  case GameErrorCode.SERVER_ERROR:
    // Show retry button
    break;
  default:
    // Show error message
}
```

## Retry Configuration

```typescript
import { retryWithBackoff } from '../utils/errorHandler';

// Default: 3 retries, 1 second initial delay
await retryWithBackoff(() => apiCall());

// Custom: 5 retries, 2 second initial delay
await retryWithBackoff(() => apiCall(), 5, 2000);
```

## Error Recovery

```typescript
import { isRecoverableError, requiresReauth } from '../utils/errorHandler';

try {
  await apiCall();
} catch (error) {
  if (requiresReauth(error)) {
    // Redirect to login
    navigate('/login');
  } else if (isRecoverableError(error)) {
    // Show retry button
    setCanRetry(true);
  } else {
    // Show error message only
    setCanRetry(false);
  }
}
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { handleApiError } from '../utils/errorHandler';
import { ApiError } from '../services/api';

describe('Error Handling', () => {
  it('should handle network errors', () => {
    const error = new ApiError('Network failed');
    const message = handleApiError(error);
    expect(message).toContain('네트워크');
  });
});
```

## Best Practices

✅ **DO:**
- Always validate API responses
- Use retry logic for network/server errors
- Provide user-friendly Korean messages
- Test error scenarios
- Log errors for debugging

❌ **DON'T:**
- Show technical error messages to users
- Retry on auth or validation errors
- Ignore validation
- Use generic error messages
- Skip error handling

## Full Example

```typescript
import { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { createGame } from '../services/gameServiceV2';
import {
  handleApiError,
  retryWithBackoff,
  validateSessionData,
  createMissingSessionError,
} from '../utils/errorHandler';
import { ErrorMessage } from '../components/common/ErrorMessage';

function GameCreator() {
  const { accessToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateGame = async (data: CreateGameRequest) => {
    setLoading(true);
    setError(null);

    try {
      // Retry on network/server errors
      const response = await retryWithBackoff(
        () => createGame(data, accessToken!)
      );

      // Validate response
      if (!response.sessions?.[0] || !validateSessionData(response.sessions[0])) {
        throw createMissingSessionError();
      }

      // Success - use the data
      console.log('Game created:', response);
    } catch (err) {
      // Convert to user-friendly message
      const message = handleApiError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => handleCreateGame(gameData)}
          onDismiss={() => setError(null)}
        />
      )}
      {loading && <LoadingSpinner />}
      <button onClick={() => handleCreateGame(gameData)}>
        Create Game
      </button>
    </div>
  );
}
```

## Need More Help?

See the full documentation: `src/utils/ERROR_HANDLING.md`
