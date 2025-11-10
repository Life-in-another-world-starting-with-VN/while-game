# Migration Guide: v1 to v2 API

## Overview

This guide helps developers migrate from the deprecated v1 API to the new v2 API. The v2 API provides a simplified, more efficient architecture with better type safety and integrated features.

## Quick Summary

### What Changed
- **Removed Services**: `gameService.ts`, `storyService.ts`, `sessionService.ts`, `aiService.ts`
- **New Services**: `gameServiceV2.ts` (consolidated game operations)
- **New Utilities**: `emotionUtils.ts`, `gameTimeTracker.ts`, `errorHandler.ts`
- **New Hook**: `useGameState.ts` (manages game state and progression)
- **ID Types**: Changed from `string` to `number` for game, session, and scene IDs

### Key Benefits
- Fewer API endpoints to manage
- Automatic session creation with games
- Integrated emotion and time tracking
- Better error handling with retry logic
- Type-safe interfaces throughout

---

## API Endpoint Changes

### Authentication (No Changes)
v2 authentication endpoints remain similar to v1:

```typescript
// v1 and v2 (similar)
POST /api/v2/signup
POST /api/v2/login
POST /api/v2/reissue
```

### Game Management

#### Creating Games

**v1 Approach:**
```typescript
// Step 1: Create game
import { createGame } from './services/gameService';
const game = await createGame({
  personality: '츤데레',
  genre: '로맨스',
  playtime: 30
}, token);

// Step 2: Create session separately
import { createSession } from './services/sessionService';
const session = await createSession(game.id, 'Player1', token);

// Step 3: Start game
import { startGame } from './services/storyService';
const progress = await startGame(game.id, token);
```

**v2 Approach:**
```typescript
// Single step: Create game (sessions auto-created)
import { createGame } from './services/gameServiceV2';
const response = await createGame({
  personality: '츤데레',
  genre: '로맨스',
  playtime: 30
}, token);

// Sessions are included in response
const firstSession = response.sessions[0];
const firstScene = firstSession.scenes[0];
```

**Migration Steps:**
1. Replace `gameService.createGame()` with `gameServiceV2.createGame()`
2. Remove separate `sessionService.createSession()` call
3. Remove `storyService.startGame()` call
4. Extract session data from game creation response

---

### Scene Progression

#### Dialogue Scenes

**v1 Approach:**
```typescript
import { getStoryState } from './services/storyService';

// Get current state
const state = await getStoryState(gameId, token);

// Display dialogue and wait for user
// ... user clicks next ...

// No explicit API call for dialogue progression
```

**v2 Approach:**
```typescript
import { generateNextScene } from './services/gameServiceV2';
import { getDefaultEmotionData } from './utils/emotionUtils';

// User clicks next on dialogue scene
const response = await generateNextScene(
  gameId,
  sessionId,
  currentSceneId,
  {
    emotion: getDefaultEmotionData(),
    time: elapsedSeconds
  },
  token
);

// New scenes returned
const nextScene = response.scenes[0];
```

**Migration Steps:**
1. Replace `getStoryState()` with `generateNextScene()`
2. Add emotion data parameter (use `getDefaultEmotionData()` if no emotion detection)
3. Add elapsed time parameter (use `GameTimeTracker`)
4. Handle response scenes array

---

#### Selection Scenes

**v1 Approach:**
```typescript
import { makeChoice } from './services/storyService';

// User makes a choice
const newState = await makeChoice(
  gameId,
  dialogueId,
  choiceId,
  token
);
```

**v2 Approach:**
```typescript
import { generateSceneAfterSelection } from './services/gameServiceV2';

// User makes a choice
const response = await generateSceneAfterSelection(
  gameId,
  sessionId,
  currentSceneId,
  selectionId,
  {
    emotion: emotionData,
    time: elapsedSeconds
  },
  token
);
```

**Migration Steps:**
1. Replace `makeChoice()` with `generateSceneAfterSelection()`
2. Use `sceneId` instead of `dialogueId`
3. Add emotion data parameter
4. Add elapsed time parameter
5. Handle response scenes array

---

## Data Structure Changes

### Game IDs

**v1:**
```typescript
interface GameResponse {
  id: string; // UUID string
  title: string;
  // ...
}
```

**v2:**
```typescript
interface CreateGameResponse {
  game_id: number; // Integer
  title: string;
  // ...
}
```

**Migration:** Update all game ID references from `string` to `number`

---

### Session Data

**v1:**
```typescript
// Sessions created separately
interface SessionResponse {
  id: string;
  game_id: string;
  host_id: string;
  // ...
}
```

**v2:**
```typescript
// Sessions included in game creation
interface SessionData {
  session_id: number;
  content: string;
  scenes: SceneData[];
  background_url?: string | null;
}

interface CreateGameResponse {
  game_id: number;
  sessions: SessionData[]; // Auto-created
  // ...
}
```

**Migration:** Extract sessions from game creation response instead of creating separately

---

### Scene Data

**v1:**
```typescript
interface StoryState {
  scene_id: string;
  dialogues: Array<{
    id: string;
    text_template: string;
    // ...
  }>;
  available_choices: Array<{
    id: string;
    text: string;
    // ...
  }>;
}
```

**v2:**
```typescript
interface SceneData {
  scene_id: number;
  type: 'dialogue' | 'selections';
  dialogue?: string | null;
  selections?: Record<string, string>;
  role: string;
  character_filename?: string | null;
}
```

**Migration:**
1. Use `scene_id` (number) instead of string ID
2. Check `type` field to determine scene behavior
3. Use `dialogue` field directly (no template)
4. Use `selections` object for choices (key = selection_id, value = text)

---

## Component Migration Examples

### Example 1: Game Creation Component

**v1 Code:**
```typescript
import { createGame } from './services/gameService';
import { createSession } from './services/sessionService';
import { startGame } from './services/storyService';

async function handleCreateGame() {
  try {
    // Create game
    const game = await createGame(gameData, token);
    
    // Create session
    const session = await createSession(game.id, playerName, token);
    
    // Start game
    const progress = await startGame(game.id, token);
    
    // Navigate to game
    navigate(`/game/${game.id}`);
  } catch (error) {
    console.error(error);
  }
}
```

**v2 Code:**
```typescript
import { useGameState } from './hooks/useGameState';

function GameCreationComponent() {
  const { createNewGame, gameState } = useGameState();

  async function handleCreateGame() {
    try {
      // Single call creates game and sessions
      await createNewGame(gameData);
      
      // Game state automatically updated
      // Time tracking automatically started
      // Navigate to game
      navigate('/game');
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <button onClick={handleCreateGame} disabled={gameState.isLoading}>
      {gameState.isLoading ? 'Creating...' : 'Create Game'}
    </button>
  );
}
```

---

### Example 2: Game Progression Component

**v1 Code:**
```typescript
import { getStoryState, makeChoice } from './services/storyService';
import { useState, useEffect } from 'react';

function GameComponent({ gameId }: { gameId: string }) {
  const [state, setState] = useState<StoryState | null>(null);

  useEffect(() => {
    loadState();
  }, [gameId]);

  async function loadState() {
    const newState = await getStoryState(gameId, token);
    setState(newState);
  }

  async function handleChoice(dialogueId: string, choiceId: string) {
    const newState = await makeChoice(gameId, dialogueId, choiceId, token);
    setState(newState);
  }

  if (!state) return <div>Loading...</div>;

  return (
    <div>
      {state.dialogues.map(d => (
        <p key={d.id}>{d.text_template}</p>
      ))}
      {state.available_choices.map(choice => (
        <button
          key={choice.id}
          onClick={() => handleChoice(choice.dialogue_id, choice.id)}
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
```

**v2 Code:**
```typescript
import { useGameState } from './hooks/useGameState';
import { normalizeEmotionData } from './utils/emotionUtils';

function GameComponent() {
  const {
    gameState,
    getCurrentScene,
    proceedToNextScene,
    selectChoice,
    hasChoices
  } = useGameState();

  const currentScene = getCurrentScene();

  async function handleNext() {
    const emotion = normalizeEmotionData(rawEmotionData);
    await proceedToNextScene(emotion);
  }

  async function handleChoice(selectionId: number) {
    const emotion = normalizeEmotionData(rawEmotionData);
    await selectChoice(selectionId, emotion);
  }

  if (gameState.isLoading) return <div>Loading...</div>;
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

## New Features to Implement

### 1. Emotion Tracking

v2 requires emotion data with each scene progression:

```typescript
import { normalizeEmotionData, getDefaultEmotionData } from './utils/emotionUtils';

// If you have emotion detection
const rawEmotion = await detectEmotion(userImage);
const emotion = normalizeEmotionData(rawEmotion);

// If no emotion detection
const emotion = getDefaultEmotionData();

// Send with scene progression
await proceedToNextScene(emotion);
```

---

### 2. Time Tracking

v2 tracks elapsed game time (excluding pauses):

```typescript
import { GameTimeTracker } from './utils/gameTimeTracker';

const tracker = new GameTimeTracker();

// Start when game begins
tracker.start();

// Pause when needed
tracker.pause();

// Resume when continuing
tracker.resume();

// Get elapsed time
const seconds = tracker.getElapsedSeconds();

// Note: useGameState hook manages this automatically
```

---

### 3. Error Handling

v2 includes comprehensive error handling:

```typescript
import { handleApiError, retryWithBackoff } from './utils/errorHandler';

try {
  // Automatic retry on network failures
  const response = await retryWithBackoff(() =>
    generateNextScene(gameId, sessionId, sceneId, data, token)
  );
} catch (error) {
  // User-friendly error messages
  const message = handleApiError(error);
  showErrorToUser(message);
}

// Note: useGameState hook includes error handling
```

---

## Checklist for Migration

### Phase 1: Update Dependencies
- [ ] Install/update required packages
- [ ] Remove v1 service imports
- [ ] Add v2 service imports

### Phase 2: Update Type Definitions
- [ ] Change game IDs from `string` to `number`
- [ ] Change session IDs from `string` to `number`
- [ ] Change scene IDs from `string` to `number`
- [ ] Update scene data structures

### Phase 3: Update Game Creation
- [ ] Replace `createGame()` with `gameServiceV2.createGame()`
- [ ] Remove separate `createSession()` calls
- [ ] Remove `startGame()` calls
- [ ] Extract sessions from game creation response

### Phase 4: Update Scene Progression
- [ ] Replace `getStoryState()` with scene progression APIs
- [ ] Replace `makeChoice()` with `generateSceneAfterSelection()`
- [ ] Add emotion data to all progression calls
- [ ] Add time tracking to all progression calls

### Phase 5: Implement New Features
- [ ] Add emotion detection or use default values
- [ ] Implement time tracking with `GameTimeTracker`
- [ ] Add error handling with retry logic
- [ ] Update UI to handle scene types

### Phase 6: Use React Hook (Recommended)
- [ ] Replace manual state management with `useGameState` hook
- [ ] Remove manual API calls
- [ ] Remove manual time tracking
- [ ] Simplify component logic

### Phase 7: Testing
- [ ] Test game creation flow
- [ ] Test dialogue scene progression
- [ ] Test selection scene progression
- [ ] Test error scenarios
- [ ] Test time tracking accuracy

### Phase 8: Cleanup
- [ ] Remove v1 service files (already done)
- [ ] Remove unused v1 types
- [ ] Remove unused v1 utilities
- [ ] Update documentation

---

## Common Issues and Solutions

### Issue 1: Type Errors with IDs

**Problem:** TypeScript errors about string vs number IDs

**Solution:**
```typescript
// Convert existing string IDs to numbers if needed
const gameId = Number(gameIdString);

// Or update your state to use numbers from the start
const [gameId, setGameId] = useState<number | null>(null);
```

---

### Issue 2: Missing Emotion Data

**Problem:** API requires emotion data but you don't have emotion detection

**Solution:**
```typescript
import { getDefaultEmotionData } from './utils/emotionUtils';

// Use default neutral emotion
const emotion = getDefaultEmotionData();
await proceedToNextScene(emotion);
```

---

### Issue 3: Scene Type Confusion

**Problem:** Not sure when to use `proceedToNextScene()` vs `selectChoice()`

**Solution:**
```typescript
const scene = getCurrentScene();

if (scene.type === 'dialogue') {
  // User clicks next
  await proceedToNextScene(emotion);
} else if (scene.type === 'selections') {
  // User selects a choice
  await selectChoice(selectionId, emotion);
}

// Or use the helper
if (hasChoices()) {
  // Show choices
} else {
  // Show next button
}
```

---

### Issue 4: Time Tracking Not Working

**Problem:** Time tracking seems inaccurate

**Solution:**
```typescript
// Make sure to start tracking when game begins
tracker.start();

// Pause when game is paused (menu, settings, etc.)
tracker.pause();

// Resume when returning to game
tracker.resume();

// Or use useGameState which handles this automatically
const { createNewGame } = useGameState();
await createNewGame(data); // Time tracking starts automatically
```

---

## Performance Improvements

v2 API provides several performance benefits:

1. **Fewer API Calls**: Game creation, session creation, and game start are now a single call
2. **Automatic Retry**: Network failures are automatically retried with exponential backoff
3. **Better Caching**: Session data is cached in the hook state
4. **Type Safety**: TypeScript catches errors at compile time

---

## Getting Help

- **API Documentation**: See [API_V2_DOCUMENTATION.md](./API_V2_DOCUMENTATION.md)
- **Error Handling**: See [src/utils/ERROR_HANDLING.md](./src/utils/ERROR_HANDLING.md)
- **Design Document**: See [.kiro/specs/api-v2-migration/design.md](./.kiro/specs/api-v2-migration/design.md)
- **Requirements**: See [.kiro/specs/api-v2-migration/requirements.md](./.kiro/specs/api-v2-migration/requirements.md)

---

## Summary

The v2 API migration simplifies your codebase by:
- Reducing the number of API endpoints
- Consolidating game operations
- Providing better type safety
- Including automatic retry logic
- Integrating emotion and time tracking

The recommended approach is to use the `useGameState` hook, which handles all the complexity for you.
