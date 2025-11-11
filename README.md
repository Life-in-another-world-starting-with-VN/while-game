# 2025 G-star project frontend

## Overview

This is a visual novel game frontend built with React, TypeScript, and Vite. The application uses the v2 API for game creation, scene progression, emotion detection, and time tracking.

## API Version

**Current Version: v2**

The application has been migrated from v1 to v2 API. The v2 API provides:
- Simplified game creation with automatic session generation
- Scene-based progression with emotion and time tracking
- Unified authentication endpoints
- Type-safe TypeScript interfaces

### v2 API Endpoints

#### Authentication
- `POST /api/v2/signup` - User registration
- `POST /api/v2/login` - User login
- `POST /api/v2/reissue` - Token refresh

#### Game Management
- `POST /api/v2/game` - Create game (returns sessions automatically)
- `POST /api/v2/game/{game_id}/{session_id}/{scene_id}` - Progress dialogue scene
- `POST /api/v2/game/{game_id}/{session_id}/{scene_id}/selection/{selection_id}` - Progress selection scene

## Project Structure

```
src/
├── components/        # Reusable UI components
├── hooks/            # Custom React hooks
│   └── useGameState.ts    # Game state management (v2)
├── pages/            # Page components
├── services/         # API service layer
│   ├── authService.ts     # Authentication (v2)
│   ├── gameServiceV2.ts   # Game operations (v2)
│   └── api.ts            # Base API client
├── store/            # Global state management
│   └── AuthContext.tsx   # Authentication context
├── types/            # TypeScript type definitions
│   └── api-v2.ts         # v2 API types
└── utils/            # Utility functions
    ├── emotionUtils.ts      # Emotion data handling
    ├── gameTimeTracker.ts   # Time tracking
    └── errorHandler.ts      # Error handling

```

## Key Features

### 1. Game Creation
Games are created with personality, genre, and playtime settings. Sessions are automatically generated and returned in the response.

```typescript
import { createGame } from './services/gameServiceV2';

const response = await createGame({
  personality: '츤데레',
  genre: '로맨스',
  playtime: 30
}, accessToken);

// Response includes sessions array
const firstSession = response.sessions[0];
```

### 2. Scene Progression
Scenes progress based on their type:
- **dialogue**: Automatic progression when user clicks
- **selections**: User chooses from available options

```typescript
import { useGameState } from './hooks/useGameState';

const { proceedToNextScene, selectChoice, getCurrentScene } = useGameState();

// For dialogue scenes
await proceedToNextScene(emotionData);

// For selection scenes
await selectChoice(selectionId, emotionData);
```

### 3. Emotion Detection
Emotion data is collected and sent with each scene progression request.

```typescript
import { normalizeEmotionData, getDefaultEmotionData } from './utils/emotionUtils';

// Convert raw emotion data to v2 format
const emotionData = normalizeEmotionData(rawData);

// Or use default values
const defaultEmotion = getDefaultEmotionData();
```

### 4. Time Tracking
Game playtime is tracked and sent with scene progression requests.

```typescript
import { GameTimeTracker } from './utils/gameTimeTracker';

const tracker = new GameTimeTracker();
tracker.start();

// Later...
const elapsedSeconds = tracker.getElapsedSeconds();
```

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Running Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Running Tests
```bash
npm run test
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Migration from v1 to v2

The application has been fully migrated to v2 API. Key changes:

### Removed Services (v1)
- `gameService.ts` - Replaced by `gameServiceV2.ts`
- `storyService.ts` - Scene progression integrated into `gameServiceV2.ts`
- `sessionService.ts` - Sessions auto-created with games
- `aiService.ts` - AI generation integrated into game/scene APIs

### New Features (v2)
- Emotion data collection and transmission
- Game time tracking (excluding pause time)
- Scene type-based routing (dialogue vs selections)
- Simplified API structure with fewer endpoints

### Breaking Changes
- Game IDs changed from `string` to `number`
- Session IDs changed from `string` to `number`
- Scene IDs changed from `string` to `number`
- Sessions are now returned with game creation (no separate creation needed)
- All scene progression requires emotion data and elapsed time

For detailed migration information, see `.kiro/specs/api-v2-migration/design.md`

## Documentation

- [API v2 Migration Design](.kiro/specs/api-v2-migration/design.md)
- [API v2 Requirements](.kiro/specs/api-v2-migration/requirements.md)
- [Error Handling Guide](src/utils/ERROR_HANDLING.md)
- [Emotion Data Format](#emotion-data-format)
- [Time Tracking Usage](#time-tracking-usage)

## Emotion Data Format

Emotion data follows the v2 API EmotionData interface:

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

All emotion values must be integers between 0 and 100. Use `emotionUtils.ts` to normalize raw emotion data:

```typescript
import { normalizeEmotionData } from './utils/emotionUtils';

// Raw data from emotion detection system
const rawData = {
  Angry: 5.2,
  Happy: 85.7,
  Neutral: 9.1
};

// Normalized to v2 format
const normalized = normalizeEmotionData(rawData);
// Result: { angry: 5, disgust: 0, fear: 0, happy: 86, sad: 0, surprise: 0, neutral: 9 }
```

## Time Tracking Usage

The `GameTimeTracker` class tracks elapsed game time in seconds, excluding paused time:

```typescript
import { GameTimeTracker } from './utils/gameTimeTracker';

const tracker = new GameTimeTracker();

// Start tracking when game begins
tracker.start();

// Pause when game is paused
tracker.pause();

// Resume when game continues
tracker.resume();

// Get elapsed time in seconds (excludes paused time)
const seconds = tracker.getElapsedSeconds();

// Reset tracker
tracker.reset();
```

The `useGameState` hook automatically manages time tracking:

```typescript
const { timeTracker, createNewGame, proceedToNextScene } = useGameState();

// Time tracking starts automatically with createNewGame()
await createNewGame(gameData);

// Elapsed time is automatically sent with scene progression
await proceedToNextScene(emotionData);
```

## License

[Add your license here]