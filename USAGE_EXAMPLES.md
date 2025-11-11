# Usage Examples

Quick reference examples for common tasks using the v2 API.

## Table of Contents
1. [Authentication](#authentication)
2. [Creating a Game](#creating-a-game)
3. [Scene Progression](#scene-progression)
4. [Emotion Tracking](#emotion-tracking)
5. [Time Tracking](#time-tracking)
6. [Complete Game Flow](#complete-game-flow)

---

## Authentication

### User Registration

```typescript
import { signup } from './services/authService';

async function registerUser() {
  try {
    const response = await signup({
      username: 'player123',
      email: 'player@example.com',
      password: 'securePassword123'
    });
    
    console.log(response.message); // "회원가입이 완료되었습니다"
    // Redirect to login page
  } catch (error) {
    console.error('Registration failed:', error);
  }
}
```

### User Login

```typescript
import { login } from './services/authService';

async function loginUser() {
  try {
    const response = await login({
      username: 'player123',
      password: 'securePassword123'
    });
    
    // Store tokens
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    
    // Redirect to game page
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

### Token Refresh

```typescript
import { reissueToken } from './services/authService';

async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await reissueToken(refreshToken);
    
    // Update stored tokens
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Redirect to login page
  }
}
```

---

## Creating a Game

### Basic Game Creation

```typescript
import { createGame } from './services/gameServiceV2';

async function createNewGame() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) throw new Error('Not authenticated');
  
  try {
    const response = await createGame({
      personality: '츤데레',
      genre: '로맨스',
      playtime: 30
    }, accessToken);
    
    console.log('Game created:', response.game_id);
    console.log('Title:', response.title);
    
    // Get first session
    const firstSession = response.sessions[0];
    console.log('Session ID:', firstSession.session_id);
    console.log('First scene:', firstSession.scenes[0]);
    
    return response;
  } catch (error) {
    console.error('Game creation failed:', error);
  }
}
```

### Using the Hook (Recommended)

```typescript
import { useGameState } from './hooks/useGameState';

function GameCreationComponent() {
  const { createNewGame, gameState } = useGameState();
  
  async function handleCreate() {
    try {
      await createNewGame({
        personality: '츤데레',
        genre: '로맨스',
        playtime: 30
      });
      
      // Game state automatically updated
      console.log('Game ID:', gameState.gameId);
      console.log('Session ID:', gameState.sessionId);
    } catch (error) {
      console.error('Failed:', error);
    }
  }
  
  return (
    <button onClick={handleCreate} disabled={gameState.isLoading}>
      {gameState.isLoading ? 'Creating...' : 'Create Game'}
    </button>
  );
}
```

---

## Scene Progression

### Dialogue Scene Progression

```typescript
import { generateNextScene } from './services/gameServiceV2';
import { getDefaultEmotionData } from './utils/emotionUtils';
import { GameTimeTracker } from './utils/gameTimeTracker';

async function progressDialogueScene() {
  const accessToken = localStorage.getItem('access_token');
  const gameId = 123;
  const sessionId = 456;
  const currentSceneId = 789;
  
  // Get emotion data (or use default)
  const emotion = getDefaultEmotionData();
  
  // Get elapsed time
  const tracker = new GameTimeTracker();
  const elapsedTime = tracker.getElapsedSeconds();
  
  try {
    const response = await generateNextScene(
      gameId,
      sessionId,
      currentSceneId,
      {
        emotion,
        time: elapsedTime
      },
      accessToken
    );
    
    // Display next scene
    const nextScene = response.scenes[0];
    console.log('Next dialogue:', nextScene.dialogue);
    
    return response;
  } catch (error) {
    console.error('Scene progression failed:', error);
  }
}
```

### Selection Scene Progression

```typescript
import { generateSceneAfterSelection } from './services/gameServiceV2';

async function handleUserChoice(selectionId: number) {
  const accessToken = localStorage.getItem('access_token');
  const gameId = 123;
  const sessionId = 456;
  const currentSceneId = 789;
  
  try {
    const response = await generateSceneAfterSelection(
      gameId,
      sessionId,
      currentSceneId,
      selectionId,
      {
        emotion: getDefaultEmotionData(),
        time: tracker.getElapsedSeconds()
      },
      accessToken
    );
    
    // Display next scene
    const nextScene = response.scenes[0];
    console.log('After choice:', nextScene.dialogue);
    
    return response;
  } catch (error) {
    console.error('Choice handling failed:', error);
  }
}
```

### Using the Hook (Recommended)

```typescript
import { useGameState } from './hooks/useGameState';

function GameSceneComponent() {
  const {
    getCurrentScene,
    proceedToNextScene,
    selectChoice,
    hasChoices,
    gameState
  } = useGameState();
  
  const currentScene = getCurrentScene();
  
  async function handleNext() {
    try {
      await proceedToNextScene(); // Emotion and time handled automatically
    } catch (error) {
      console.error('Failed:', error);
    }
  }
  
  async function handleChoice(choiceId: number) {
    try {
      await selectChoice(choiceId); // Emotion and time handled automatically
    } catch (error) {
      console.error('Failed:', error);
    }
  }
  
  if (!currentScene) return <div>No scene</div>;
  
  return (
    <div>
      <p>{currentScene.dialogue}</p>
      
      {hasChoices() && currentScene.selections && (
        <div>
          {Object.entries(currentScene.selections).map(([id, text]) => (
            <button key={id} onClick={() => handleChoice(Number(id))}>
              {text}
            </button>
          ))}
        </div>
      )}
      
      {!hasChoices() && (
        <button onClick={handleNext}>Next</button>
      )}
    </div>
  );
}
```

---

## Emotion Tracking

### Using Default Emotions

```typescript
import { getDefaultEmotionData } from './utils/emotionUtils';

const emotion = getDefaultEmotionData();
// { angry: 0, disgust: 0, fear: 0, happy: 0, sad: 0, surprise: 0, neutral: 100 }

await proceedToNextScene(emotion);
```

### Normalizing Raw Emotion Data

```typescript
import { normalizeEmotionData } from './utils/emotionUtils';

// From emotion detection system
const rawEmotion = {
  Angry: 5.2,
  Happy: 85.7,
  Neutral: 9.1,
  // Other emotions missing
};

const normalized = normalizeEmotionData(rawEmotion);
// { angry: 5, disgust: 0, fear: 0, happy: 86, sad: 0, surprise: 0, neutral: 9 }

await proceedToNextScene(normalized);
```

### Handling Null Emotion Data

```typescript
import { normalizeEmotionData } from './utils/emotionUtils';

// If emotion detection fails
const rawEmotion = null;

const emotion = normalizeEmotionData(rawEmotion);
// Returns default: { angry: 0, ..., neutral: 100 }

await proceedToNextScene(emotion);
```

### Custom Emotion Values

```typescript
import { clampEmotionValue } from './utils/emotionUtils';

const customEmotion = {
  angry: clampEmotionValue(10),
  disgust: clampEmotionValue(0),
  fear: clampEmotionValue(5),
  happy: clampEmotionValue(70),
  sad: clampEmotionValue(0),
  surprise: clampEmotionValue(15),
  neutral: clampEmotionValue(0)
};

await proceedToNextScene(customEmotion);
```

---

## Time Tracking

### Basic Time Tracking

```typescript
import { GameTimeTracker } from './utils/gameTimeTracker';

const tracker = new GameTimeTracker();

// Start tracking when game begins
tracker.start();

// ... game plays for 60 seconds ...

console.log(tracker.getElapsedSeconds()); // 60
```

### With Pause/Resume

```typescript
const tracker = new GameTimeTracker();

// Game starts
tracker.start();

// ... 60 seconds pass ...

// User opens menu
tracker.pause();

// ... 30 seconds pass (paused) ...

// User closes menu
tracker.resume();

// ... 40 seconds pass ...

console.log(tracker.getElapsedSeconds()); // 100 (60 + 40, pause excluded)
```

### Resetting Tracker

```typescript
const tracker = new GameTimeTracker();

tracker.start();
// ... game plays ...

// Start new game
tracker.reset();
tracker.start();
```

### Using with Scene Progression

```typescript
const tracker = new GameTimeTracker();

// Start when game begins
tracker.start();

// Progress scene with elapsed time
async function progressScene() {
  const elapsedTime = tracker.getElapsedSeconds();
  
  await generateNextScene(
    gameId,
    sessionId,
    sceneId,
    {
      emotion: getDefaultEmotionData(),
      time: elapsedTime
    },
    accessToken
  );
}
```

---

## Complete Game Flow

### Full Example with Hook

```typescript
import { useGameState } from './hooks/useGameState';
import { normalizeEmotionData } from './utils/emotionUtils';
import { useState } from 'react';

function CompleteGameExample() {
  const {
    gameState,
    createNewGame,
    proceedToNextScene,
    selectChoice,
    getCurrentScene,
    hasChoices,
    isLastScene,
    resetGame
  } = useGameState();
  
  const [rawEmotionData, setRawEmotionData] = useState(null);
  
  // Step 1: Create game
  async function handleCreateGame() {
    try {
      await createNewGame({
        personality: '츤데레',
        genre: '로맨스',
        playtime: 30
      });
      // Time tracking starts automatically
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  }
  
  // Step 2: Progress through scenes
  async function handleNextScene() {
    try {
      const emotion = normalizeEmotionData(rawEmotionData);
      await proceedToNextScene(emotion);
      // Time is sent automatically
    } catch (error) {
      console.error('Failed to progress:', error);
    }
  }
  
  // Step 3: Handle choices
  async function handleChoice(choiceId: number) {
    try {
      const emotion = normalizeEmotionData(rawEmotionData);
      await selectChoice(choiceId, emotion);
    } catch (error) {
      console.error('Failed to select choice:', error);
    }
  }
  
  // Step 4: End game
  function handleEndGame() {
    resetGame();
    // Navigate to main menu
  }
  
  const currentScene = getCurrentScene();
  
  // Render based on game state
  if (gameState.error) {
    return (
      <div>
        <p>Error: {gameState.error}</p>
        <button onClick={resetGame}>Try Again</button>
      </div>
    );
  }
  
  if (gameState.isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!currentScene) {
    return (
      <div>
        <h1>Create New Game</h1>
        <button onClick={handleCreateGame}>Start</button>
      </div>
    );
  }
  
  return (
    <div>
      {/* Display scene */}
      <div>
        <p>{currentScene.dialogue}</p>
        {currentScene.character_filename && (
          <img src={currentScene.character_filename} alt="Character" />
        )}
      </div>
      
      {/* Display choices or next button */}
      {hasChoices() && currentScene.selections ? (
        <div>
          {Object.entries(currentScene.selections).map(([id, text]) => (
            <button key={id} onClick={() => handleChoice(Number(id))}>
              {text}
            </button>
          ))}
        </div>
      ) : (
        <div>
          {!isLastScene() ? (
            <button onClick={handleNextScene}>Next</button>
          ) : (
            <button onClick={handleEndGame}>End Game</button>
          )}
        </div>
      )}
      
      {/* Game info */}
      <div>
        <p>Game ID: {gameState.gameId}</p>
        <p>Session ID: {gameState.sessionId}</p>
        <p>Scene: {gameState.currentSceneIndex + 1} / {gameState.scenes.length}</p>
      </div>
    </div>
  );
}
```

### Full Example without Hook

```typescript
import { useState, useEffect } from 'react';
import { createGame, generateNextScene, generateSceneAfterSelection } from './services/gameServiceV2';
import { GameTimeTracker } from './utils/gameTimeTracker';
import { normalizeEmotionData, getDefaultEmotionData } from './utils/emotionUtils';
import type { SceneData } from './types/api-v2';

function ManualGameExample() {
  const [gameId, setGameId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const tracker = new GameTimeTracker();
  const accessToken = localStorage.getItem('access_token');
  
  async function handleCreateGame() {
    if (!accessToken) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await createGame({
        personality: '츤데레',
        genre: '로맨스',
        playtime: 30
      }, accessToken);
      
      const firstSession = response.sessions[0];
      setGameId(response.game_id);
      setSessionId(firstSession.session_id);
      setScenes(firstSession.scenes);
      setCurrentIndex(0);
      
      tracker.start();
    } catch (err) {
      setError('Failed to create game');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleNextScene() {
    if (!accessToken || !gameId || !sessionId) return;
    
    const currentScene = scenes[currentIndex];
    if (!currentScene) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await generateNextScene(
        gameId,
        sessionId,
        currentScene.scene_id,
        {
          emotion: getDefaultEmotionData(),
          time: tracker.getElapsedSeconds()
        },
        accessToken
      );
      
      setScenes(response.scenes);
      setCurrentIndex(0);
    } catch (err) {
      setError('Failed to progress scene');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleChoice(choiceId: number) {
    if (!accessToken || !gameId || !sessionId) return;
    
    const currentScene = scenes[currentIndex];
    if (!currentScene) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await generateSceneAfterSelection(
        gameId,
        sessionId,
        currentScene.scene_id,
        choiceId,
        {
          emotion: getDefaultEmotionData(),
          time: tracker.getElapsedSeconds()
        },
        accessToken
      );
      
      setScenes(response.scenes);
      setCurrentIndex(0);
    } catch (err) {
      setError('Failed to select choice');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  const currentScene = scenes[currentIndex];
  const hasChoices = currentScene?.type === 'selections';
  const isLastScene = currentIndex >= scenes.length - 1;
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!currentScene) {
    return <button onClick={handleCreateGame}>Create Game</button>;
  }
  
  return (
    <div>
      <p>{currentScene.dialogue}</p>
      
      {hasChoices && currentScene.selections ? (
        <div>
          {Object.entries(currentScene.selections).map(([id, text]) => (
            <button key={id} onClick={() => handleChoice(Number(id))}>
              {text}
            </button>
          ))}
        </div>
      ) : (
        !isLastScene && <button onClick={handleNextScene}>Next</button>
      )}
    </div>
  );
}
```

---

## Tips and Best Practices

1. **Always use the hook**: `useGameState` handles complexity for you
2. **Handle errors gracefully**: Show user-friendly messages
3. **Use default emotions**: If you don't have emotion detection
4. **Let the hook manage time**: Don't manually track time when using `useGameState`
5. **Check scene type**: Before calling progression functions
6. **Store tokens securely**: Use secure storage for authentication tokens
7. **Validate user input**: Before sending to API
8. **Test error scenarios**: Network failures, invalid data, etc.

---

For more detailed information, see:
- [API Documentation](./API_V2_DOCUMENTATION.md)
- [Migration Guide](./MIGRATION_GUIDE_V1_TO_V2.md)
- [Error Handling Guide](./src/utils/ERROR_HANDLING.md)
