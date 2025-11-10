# API v2 Documentation

## Overview

This document provides comprehensive documentation for the v2 API services, utilities, and hooks used in the application.

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [Game Service](#game-service)
3. [Emotion Utilities](#emotion-utilities)
4. [Game Time Tracker](#game-time-tracker)
5. [Game State Hook](#game-state-hook)
6. [Error Handling](#error-handling)
7. [Type Definitions](#type-definitions)

---

## Authentication Service

**File:** `src/services/authService.ts`

Handles user authentication operations using v2 API endpoints.

### Functions

#### `signup(data: SignupRequest): Promise<SignupResponse>`

Register a new user.

**Parameters:**
- `data.username` (string) - Unique username
- `data.email` (string) - User email address
- `data.password` (string) - User password

**Returns:**
- `message` (string) - Confirmation message

**Example:**
```typescript
import { signup } from './services/authService';

const response = await signup({
  username: 'player123',
  email: 'player@example.com',
  password: 'securePassword123'
});

console.log(response.message); // "회원가입이 완료되었습니다"
```

**Throws:**
- `ApiError` - If registration fails (e.g., username already exists)

---

#### `login(data: LoginRequest): Promise<LoginResponse>`

Authenticate user and receive access and refresh tokens.

**Parameters:**
- `data.username` (string) - User's username
- `data.password` (string) - User's password

**Returns:**
- `access_token` (string) - JWT access token for API requests
- `refresh_token` (string) - JWT refresh token for token renewal

**Example:**
```typescript
import { login } from './services/authService';

const response = await login({
  username: 'player123',
  password: 'securePassword123'
});

// Store tokens
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('refresh_token', response.refresh_token);
```

**Throws:**
- `ApiError` - If authentication fails (invalid credentials)

---

#### `reissueToken(refreshToken: string): Promise<ReissueResponse>`

Refresh access token using a valid refresh token.

**Parameters:**
- `refreshToken` (string) - Valid refresh token

**Returns:**
- `access_token` (string) - New JWT access token
- `refresh_token` (string) - New JWT refresh token

**Example:**
```typescript
import { reissueToken } from './services/authService';

const oldRefreshToken = localStorage.getItem('refresh_token');
const response = await reissueToken(oldRefreshToken);

// Update stored tokens
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('refresh_token', response.refresh_token);
```

**Throws:**
- `ApiError` - If token refresh fails (expired or invalid token)

---

## Game Service

**File:** `src/services/gameServiceV2.ts`

Handles game creation and scene progression using v2 API endpoints.

### Functions

#### `createGame(data: CreateGameRequest, token: string): Promise<CreateGameResponse>`

Create a new game with automatic session generation.

**Parameters:**
- `data.personality` (string) - Character personality (e.g., "츤데레", "순수", "활발함")
- `data.genre` (string) - Game genre (e.g., "로맨스", "판타지", "학원물")
- `data.playtime` (number) - Expected playtime in minutes
- `token` (string) - User's access token

**Returns:**
- `game_id` (number) - Unique game identifier
- `personality` (string) - Character personality
- `genre` (string) - Game genre
- `title` (string) - Generated game title
- `playtime` (number) - Expected playtime
- `sessions` (SessionData[]) - Array of game sessions with initial scenes

**Example:**
```typescript
import { createGame } from './services/gameServiceV2';

const response = await createGame({
  personality: '츤데레',
  genre: '로맨스',
  playtime: 30
}, accessToken);

console.log(response.game_id); // 123
console.log(response.sessions[0].scenes); // Initial scenes
```

**Throws:**
- `ApiError` - If game creation fails

---

#### `generateNextScene(gameId, sessionId, sceneId, data, token): Promise<NextSceneResponse>`

Progress to the next scene for dialogue-type scenes.

**Parameters:**
- `gameId` (number) - Game identifier
- `sessionId` (number) - Session identifier
- `sceneId` (number) - Current scene identifier
- `data.emotion` (EmotionData) - Current emotion data
- `data.time` (number) - Elapsed time in seconds
- `token` (string) - User's access token

**Returns:**
- `session_id` (number) - Session identifier
- `content` (string) - Session content/description
- `scenes` (SceneData[]) - Array of next scenes
- `background_url` (string | null) - Background image URL

**Example:**
```typescript
import { generateNextScene } from './services/gameServiceV2';
import { getDefaultEmotionData } from './utils/emotionUtils';

const response = await generateNextScene(
  123,           // gameId
  456,           // sessionId
  789,           // sceneId
  {
    emotion: getDefaultEmotionData(),
    time: 120    // 2 minutes elapsed
  },
  accessToken
);

console.log(response.scenes[0].dialogue); // Next dialogue
```

**Throws:**
- `ApiError` - If scene generation fails

---

#### `generateSceneAfterSelection(gameId, sessionId, sceneId, selectionId, data, token): Promise<NextSceneResponse>`

Progress to the next scene after user makes a selection.

**Parameters:**
- `gameId` (number) - Game identifier
- `sessionId` (number) - Session identifier
- `sceneId` (number) - Current scene identifier
- `selectionId` (number) - Selected choice identifier
- `data.emotion` (EmotionData) - Current emotion data
- `data.time` (number) - Elapsed time in seconds
- `token` (string) - User's access token

**Returns:**
- Same as `generateNextScene()`

**Example:**
```typescript
import { generateSceneAfterSelection } from './services/gameServiceV2';

const response = await generateSceneAfterSelection(
  123,           // gameId
  456,           // sessionId
  789,           // sceneId
  2,             // selectionId (user chose option 2)
  {
    emotion: emotionData,
    time: 150
  },
  accessToken
);

console.log(response.scenes[0].dialogue); // Next dialogue based on choice
```

**Throws:**
- `ApiError` - If scene generation fails

---

## Emotion Utilities

**File:** `src/utils/emotionUtils.ts`

Utilities for converting and normalizing emotion data to v2 API format.

### Functions

#### `clampEmotionValue(value: number): number`

Clamps an emotion value to the valid 0-100 range.

**Parameters:**
- `value` (number) - The emotion value to clamp

**Returns:**
- (number) - The clamped value between 0 and 100

**Example:**
```typescript
import { clampEmotionValue } from './utils/emotionUtils';

clampEmotionValue(150);  // Returns 100
clampEmotionValue(-10);  // Returns 0
clampEmotionValue(75.8); // Returns 76 (rounded)
```

---

#### `getDefaultEmotionData(): EmotionData`

Returns default emotion data with neutral emotion set to 100 and all other emotions set to 0.

**Returns:**
- (EmotionData) - Default emotion object

**Example:**
```typescript
import { getDefaultEmotionData } from './utils/emotionUtils';

const defaultEmotion = getDefaultEmotionData();
// { angry: 0, disgust: 0, fear: 0, happy: 0, sad: 0, surprise: 0, neutral: 100 }
```

---

#### `normalizeEmotionData(raw: RawEmotionData | null): EmotionData`

Normalizes raw emotion data to v2 API EmotionData format.

**Features:**
- Handles null or undefined input by returning default values
- Maps common emotion key variations to standard v2 format
- Clamps all values to 0-100 range
- Provides default values for missing emotions

**Parameters:**
- `raw` (RawEmotionData | null) - Raw emotion data from detection system

**Returns:**
- (EmotionData) - Normalized emotion object

**Example:**
```typescript
import { normalizeEmotionData } from './utils/emotionUtils';

// Example 1: Normal usage
const rawData = {
  Angry: 5.2,
  Happy: 85.7,
  Neutral: 9.1
};
const normalized = normalizeEmotionData(rawData);
// { angry: 5, disgust: 0, fear: 0, happy: 86, sad: 0, surprise: 0, neutral: 9 }

// Example 2: Null input
const defaultData = normalizeEmotionData(null);
// { angry: 0, disgust: 0, fear: 0, happy: 0, sad: 0, surprise: 0, neutral: 100 }

// Example 3: Out of range values
const outOfRange = {
  angry: 150,
  happy: -20,
  neutral: 50
};
const clamped = normalizeEmotionData(outOfRange);
// { angry: 100, disgust: 0, fear: 0, happy: 0, sad: 0, surprise: 0, neutral: 50 }
```

---

## Game Time Tracker

**File:** `src/utils/gameTimeTracker.ts`

Tracks elapsed game time in seconds, excluding paused time.

### Class: `GameTimeTracker`

#### Methods

##### `start(): void`

Start tracking time from now. Resets any previous tracking data.

**Example:**
```typescript
import { GameTimeTracker } from './utils/gameTimeTracker';

const tracker = new GameTimeTracker();
tracker.start();
```

---

##### `pause(): void`

Pause the time tracking. Can be called multiple times safely.

**Example:**
```typescript
tracker.pause(); // Game paused
```

---

##### `resume(): void`

Resume time tracking after pause. Paused time is excluded from elapsed time.

**Example:**
```typescript
tracker.resume(); // Game resumed
```

---

##### `getElapsedSeconds(): number`

Get elapsed time in seconds, excluding paused time.

**Returns:**
- (number) - Elapsed seconds as an integer

**Example:**
```typescript
const elapsed = tracker.getElapsedSeconds();
console.log(`Game played for ${elapsed} seconds`);
```

---

##### `reset(): void`

Reset the tracker to initial state.

**Example:**
```typescript
tracker.reset(); // Ready for new game
```

---

### Usage Example

```typescript
import { GameTimeTracker } from './utils/gameTimeTracker';

const tracker = new GameTimeTracker();

// Game starts
tracker.start();

// ... 60 seconds pass ...
console.log(tracker.getElapsedSeconds()); // 60

// User pauses game
tracker.pause();

// ... 30 seconds pass while paused ...

// User resumes game
tracker.resume();

// ... 40 seconds pass ...
console.log(tracker.getElapsedSeconds()); // 100 (60 + 40, pause time excluded)
```

---

## Game State Hook

**File:** `src/hooks/useGameState.ts`

Custom React hook for managing game state with v2 API.

### Hook: `useGameState()`

**Returns:** `UseGameStateReturn` object with:
- `gameState` - Current game state
- `timeTracker` - GameTimeTracker instance
- `createNewGame()` - Create new game function
- `proceedToNextScene()` - Progress dialogue scene function
- `selectChoice()` - Select choice function
- `getCurrentScene()` - Get current scene function
- `isLastScene()` - Check if last scene function
- `hasChoices()` - Check if scene has choices function
- `resetGame()` - Reset game state function

### Functions

#### `createNewGame(data: CreateGameRequest): Promise<void>`

Create a new game and initialize state. Automatically starts time tracking.

**Parameters:**
- `data` - Game creation data (personality, genre, playtime)

**Example:**
```typescript
import { useGameState } from './hooks/useGameState';

function GameComponent() {
  const { createNewGame, gameState } = useGameState();

  const handleCreateGame = async () => {
    await createNewGame({
      personality: '츤데레',
      genre: '로맨스',
      playtime: 30
    });
  };

  return (
    <div>
      {gameState.isLoading ? 'Loading...' : 'Ready'}
    </div>
  );
}
```

---

#### `proceedToNextScene(emotion?: EmotionData | null): Promise<void>`

Proceed to next scene for dialogue type scenes. Sends emotion data and elapsed time to API.

**Parameters:**
- `emotion` (optional) - Emotion data (uses default if not provided)

**Example:**
```typescript
const { proceedToNextScene, getCurrentScene } = useGameState();

const handleNextScene = async () => {
  const currentScene = getCurrentScene();
  
  if (currentScene?.type === 'dialogue') {
    await proceedToNextScene(emotionData);
  }
};
```

---

#### `selectChoice(selectionId: number, emotion?: EmotionData | null): Promise<void>`

Select a choice in a selections type scene.

**Parameters:**
- `selectionId` (number) - ID of the selected choice
- `emotion` (optional) - Emotion data (uses default if not provided)

**Example:**
```typescript
const { selectChoice, getCurrentScene } = useGameState();

const handleChoice = async (choiceId: number) => {
  const currentScene = getCurrentScene();
  
  if (currentScene?.type === 'selections') {
    await selectChoice(choiceId, emotionData);
  }
};
```

---

#### `getCurrentScene(): SceneData | null`

Get the current scene being displayed.

**Returns:**
- (SceneData | null) - Current scene or null if no scene

**Example:**
```typescript
const { getCurrentScene } = useGameState();

const currentScene = getCurrentScene();
if (currentScene) {
  console.log(currentScene.dialogue);
  console.log(currentScene.type); // 'dialogue' or 'selections'
}
```

---

#### `isLastScene(): boolean`

Check if current scene is the last scene in the array.

**Returns:**
- (boolean) - True if last scene

**Example:**
```typescript
const { isLastScene } = useGameState();

if (isLastScene()) {
  console.log('This is the final scene!');
}
```

---

#### `hasChoices(): boolean`

Check if current scene has choices (selections type).

**Returns:**
- (boolean) - True if scene has choices

**Example:**
```typescript
const { hasChoices, getCurrentScene } = useGameState();

if (hasChoices()) {
  const scene = getCurrentScene();
  const choices = scene?.selections;
  // Display choices to user
}
```

---

#### `resetGame(): void`

Reset game state to initial values and reset time tracker.

**Example:**
```typescript
const { resetGame } = useGameState();

const handleQuitGame = () => {
  resetGame();
  // Navigate to main menu
};
```

---

### Complete Usage Example

```typescript
import { useGameState } from './hooks/useGameState';
import { normalizeEmotionData } from './utils/emotionUtils';

function GamePage() {
  const {
    gameState,
    createNewGame,
    proceedToNextScene,
    selectChoice,
    getCurrentScene,
    hasChoices,
    isLastScene
  } = useGameState();

  const currentScene = getCurrentScene();

  const handleCreateGame = async () => {
    await createNewGame({
      personality: '츤데레',
      genre: '로맨스',
      playtime: 30
    });
  };

  const handleProgress = async () => {
    const emotionData = normalizeEmotionData(rawEmotionData);
    
    if (currentScene?.type === 'dialogue') {
      await proceedToNextScene(emotionData);
    }
  };

  const handleSelectChoice = async (choiceId: number) => {
    const emotionData = normalizeEmotionData(rawEmotionData);
    await selectChoice(choiceId, emotionData);
  };

  if (gameState.isLoading) {
    return <div>Loading...</div>;
  }

  if (gameState.error) {
    return <div>Error: {gameState.error}</div>;
  }

  if (!currentScene) {
    return <button onClick={handleCreateGame}>Start Game</button>;
  }

  return (
    <div>
      <p>{currentScene.dialogue}</p>
      
      {hasChoices() && currentScene.selections && (
        <div>
          {Object.entries(currentScene.selections).map(([id, text]) => (
            <button key={id} onClick={() => handleSelectChoice(Number(id))}>
              {text}
            </button>
          ))}
        </div>
      )}
      
      {!hasChoices() && !isLastScene() && (
        <button onClick={handleProgress}>Next</button>
      )}
    </div>
  );
}
```

---

## Error Handling

**File:** `src/utils/errorHandler.ts`

Comprehensive error handling utilities for v2 API.

### Key Functions

- `handleApiError(error: unknown): string` - Convert errors to user-friendly messages
- `retryWithBackoff(fn: Function, maxRetries?: number): Promise<T>` - Retry failed requests
- `validateSessionData(session: any): boolean` - Validate session data structure
- `validateSceneData(scene: any): boolean` - Validate scene data structure

See [Error Handling Guide](src/utils/ERROR_HANDLING.md) for detailed documentation.

---

## Type Definitions

**File:** `src/types/api-v2.ts`

### EmotionData

```typescript
interface EmotionData {
  angry: number;      // 0-100
  disgust: number;    // 0-100
  fear: number;       // 0-100
  happy: number;      // 0-100
  sad: number;        // 0-100
  surprise: number;   // 0-100
  neutral: number;    // 0-100
}
```

### SceneData

```typescript
interface SceneData {
  role: string;
  scene_id: number;
  type: 'dialogue' | 'selections';
  dialogue?: string | null;
  selections?: Record<string, string>; // key: selection_id, value: text
  character_filename?: string | null;
}
```

### SessionData

```typescript
interface SessionData {
  session_id: number;
  content: string;
  scenes: SceneData[];
  background_url?: string | null;
}
```

### CreateGameRequest

```typescript
interface CreateGameRequest {
  personality: string;
  genre: string;
  playtime: number;
}
```

### CreateGameResponse

```typescript
interface CreateGameResponse {
  game_id: number;
  personality: string;
  genre: string;
  title: string;
  playtime: number;
  sessions: SessionData[];
}
```

### NextSceneRequest

```typescript
interface NextSceneRequest {
  emotion: EmotionData;
  time: number; // seconds
}
```

### NextSceneResponse

```typescript
interface NextSceneResponse {
  session_id: number;
  content: string;
  scenes: SceneData[];
  background_url?: string | null;
}
```

---

## Best Practices

### 1. Always Use Emotion Utilities

```typescript
// ✅ Good
import { normalizeEmotionData } from './utils/emotionUtils';
const emotion = normalizeEmotionData(rawData);

// ❌ Bad
const emotion = {
  angry: rawData.angry || 0,
  // ... manual mapping
};
```

### 2. Let useGameState Manage Time Tracking

```typescript
// ✅ Good
const { createNewGame, proceedToNextScene } = useGameState();
await createNewGame(data); // Time tracking starts automatically
await proceedToNextScene(); // Time is sent automatically

// ❌ Bad
const tracker = new GameTimeTracker();
tracker.start();
// Manual time management
```

### 3. Validate Scene Type Before Actions

```typescript
// ✅ Good
const scene = getCurrentScene();
if (scene?.type === 'dialogue') {
  await proceedToNextScene();
} else if (scene?.type === 'selections') {
  await selectChoice(choiceId);
}

// ❌ Bad
await proceedToNextScene(); // Might fail if scene is 'selections'
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Good
try {
  await createNewGame(data);
} catch (error) {
  console.error('Failed to create game:', error);
  // Show user-friendly error message
}

// ❌ Bad
await createNewGame(data); // Unhandled errors crash the app
```

---

## Migration from v1

If you're migrating from v1 API, see the [Migration Guide](.kiro/specs/api-v2-migration/design.md) for detailed information on:

- API endpoint changes
- Data structure changes
- Service layer changes
- Component updates

---

## Support

For issues or questions:
1. Check the [Error Handling Guide](src/utils/ERROR_HANDLING.md)
2. Review the [Design Document](.kiro/specs/api-v2-migration/design.md)
3. Check the [Requirements Document](.kiro/specs/api-v2-migration/requirements.md)
