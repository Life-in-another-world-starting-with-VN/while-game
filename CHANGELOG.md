# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - v2 API Migration

### Added

#### New Services
- **gameServiceV2.ts**: Consolidated game management service
  - `createGame()`: Create game with automatic session generation
  - `generateNextScene()`: Progress dialogue scenes with emotion and time data
  - `generateSceneAfterSelection()`: Progress selection scenes with user choices

#### New Utilities
- **emotionUtils.ts**: Emotion data handling utilities
  - `normalizeEmotionData()`: Convert raw emotion data to v2 format
  - `getDefaultEmotionData()`: Get default neutral emotion values
  - `clampEmotionValue()`: Ensure emotion values are within 0-100 range

- **gameTimeTracker.ts**: Game time tracking utility
  - `GameTimeTracker` class: Track elapsed game time excluding pauses
  - `start()`, `pause()`, `resume()`: Control time tracking
  - `getElapsedSeconds()`: Get elapsed time in seconds
  - `reset()`: Reset tracker state

- **errorHandler.ts**: Comprehensive error handling
  - `handleApiError()`: Convert errors to user-friendly messages
  - `retryWithBackoff()`: Automatic retry with exponential backoff
  - `validateSessionData()`: Validate session data structure
  - `validateSceneData()`: Validate scene data structure
  - Error factory functions for common error scenarios

#### New Hooks
- **useGameState.ts**: React hook for game state management
  - `createNewGame()`: Create game and initialize state
  - `proceedToNextScene()`: Progress dialogue scenes
  - `selectChoice()`: Handle selection scenes
  - `getCurrentScene()`: Get current scene data
  - `isLastScene()`: Check if on last scene
  - `hasChoices()`: Check if scene has choices
  - `resetGame()`: Reset game state
  - Automatic time tracking integration
  - Built-in error handling with retry logic

#### New Documentation
- **README.md**: Comprehensive project documentation
  - Project overview and structure
  - API v2 endpoint documentation
  - Feature guides (emotion tracking, time tracking)
  - Development setup instructions
  - Migration information

- **API_V2_DOCUMENTATION.md**: Complete API reference
  - Detailed function documentation with examples
  - Type definitions and interfaces
  - Best practices and usage patterns
  - Common use cases and solutions

- **MIGRATION_GUIDE_V1_TO_V2.md**: Migration guide
  - Step-by-step migration instructions
  - API endpoint changes
  - Data structure changes
  - Component migration examples
  - Common issues and solutions

- **CHANGELOG.md**: Project changelog (this file)

#### New Types
- **EmotionData**: Emotion values (0-100) for 7 emotions
- **SceneData**: Scene information with type-based structure
- **SessionData**: Session data with scenes and background
- **CreateGameRequest/Response**: Game creation interfaces
- **NextSceneRequest/Response**: Scene progression interfaces

### Changed

#### API Endpoints
- Game creation now returns sessions automatically (no separate session creation needed)
- Scene progression requires emotion data and elapsed time
- All IDs changed from `string` to `number` type

#### Data Structures
- **Game IDs**: `string` → `number`
- **Session IDs**: `string` → `number`
- **Scene IDs**: `string` → `number`
- **Scene Structure**: Simplified with `type` field ('dialogue' | 'selections')
- **Selections**: Changed from array to `Record<string, string>` object

#### Service Layer
- Consolidated multiple services into `gameServiceV2.ts`
- Removed separate session management
- Removed separate story state management
- Removed AI job polling (now synchronous)

### Removed

#### Deprecated Services
- **gameService.ts**: Replaced by `gameServiceV2.ts`
  - `getGames()`: No longer needed (sessions returned with game creation)
  - `createGame()`: Use `gameServiceV2.createGame()` instead
  - `getGame()`: No longer needed (use session data)

- **storyService.ts**: Integrated into `gameServiceV2.ts`
  - `startGame()`: No longer needed (sessions auto-created)
  - `getStoryState()`: Use scene data from progression responses
  - `makeChoice()`: Use `gameServiceV2.generateSceneAfterSelection()`
  - `getProgress()`: Track state in `useGameState` hook
  - `updateState()`: State managed by backend

- **sessionService.ts**: Sessions now auto-created
  - `createSession()`: Sessions created with game
  - `getSession()`: Session data in game creation response
  - `getMessages()`: Messaging feature removed
  - `sendMessage()`: Messaging feature removed

- **aiService.ts**: AI generation now integrated
  - `generateContent()`: Integrated into game/scene APIs
  - `getJobStatus()`: No polling needed (synchronous)
  - `waitForJobCompletion()`: No polling needed
  - `generateAndWaitForContent()`: Use `createGame()` directly

### Fixed
- Improved error handling with automatic retry logic
- Better type safety throughout the application
- More consistent API response structures
- Eliminated race conditions in async operations

### Security
- Enhanced token refresh mechanism
- Better error message sanitization
- Improved input validation

---

## Migration Notes

### Breaking Changes

1. **ID Type Changes**: All game, session, and scene IDs are now `number` instead of `string`
2. **Session Creation**: Sessions are automatically created with games, no separate creation needed
3. **Scene Progression**: All progression requests now require emotion data and elapsed time
4. **Scene Structure**: Scenes now have a `type` field to distinguish dialogue from selections
5. **API Endpoints**: Several v1 endpoints have been removed or consolidated

### Recommended Migration Path

1. Update all ID types from `string` to `number`
2. Replace v1 service imports with v2 equivalents
3. Implement emotion tracking (or use default values)
4. Implement time tracking with `GameTimeTracker`
5. Update scene progression logic to handle scene types
6. Consider using `useGameState` hook for simplified state management
7. Test all game flows thoroughly

See [MIGRATION_GUIDE_V1_TO_V2.md](./MIGRATION_GUIDE_V1_TO_V2.md) for detailed instructions.

---

## [1.0.0] - Initial Release

### Added
- Initial project setup with React, TypeScript, and Vite
- v1 API integration
- Basic authentication flow
- Game creation and management
- Story progression system
- Session management
- AI content generation with polling

---

## Version History

- **2.0.0**: v2 API migration with emotion tracking, time tracking, and simplified architecture
- **1.0.0**: Initial release with v1 API
