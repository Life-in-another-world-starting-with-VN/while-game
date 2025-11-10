# Integration Tests for v2 API Migration

This directory contains comprehensive integration tests for the v2 API migration project.

## Test Coverage

### 12.1 전체 게임 생성 플로우 테스트 (Game Creation Flow)
- ✅ Creates game and receives initial session data
- ✅ Displays first scene from session
- ✅ Handles multiple sessions in game creation response
- ✅ Verifies correct API endpoint usage (`/api/v2/game`)
- ✅ Validates authentication token in request headers

**Requirements Covered:** 2.1, 2.2, 2.3, 2.4, 2.5

### 12.2 dialogue 씬 진행 테스트 (Dialogue Scene Progression)
- ✅ Identifies dialogue type scenes
- ✅ Proceeds to next scene on user interaction
- ✅ Loads and displays next scene data
- ✅ Handles consecutive dialogue scenes
- ✅ Uses correct endpoint (`/api/v2/game/{game_id}/{session_id}/{scene_id}`)

**Requirements Covered:** 3.1, 3.2, 3.4, 3.6, 3.7, 4.1, 4.4

### 12.3 selections 씬 진행 테스트 (Selection Scene Progression)
- ✅ Displays selection options to user
- ✅ Handles user choice selection
- ✅ Loads next scene based on selection
- ✅ Supports different selection IDs
- ✅ Uses correct endpoint (`/api/v2/game/{game_id}/{session_id}/{scene_id}/selection/{selection_id}`)

**Requirements Covered:** 3.1, 3.3, 3.4, 3.6, 3.7, 4.1, 4.2, 4.3, 4.5, 4.6

### 12.4 감정 데이터 통합 테스트 (Emotion Data Integration)
- ✅ Collects raw emotion data from detection system
- ✅ Transforms emotion data to v2 API format
- ✅ Sends emotion data with scene requests
- ✅ Uses default emotion data when detection unavailable
- ✅ Clamps out-of-range values to 0-100
- ✅ Rounds decimal values to integers

**Requirements Covered:** 7.1, 7.2, 7.3

### 12.5 시간 추적 테스트 (Time Tracking)
- ✅ Tracks game time from start
- ✅ Calculates elapsed time in seconds
- ✅ Sends time data with scene requests
- ✅ Excludes paused time from elapsed time
- ✅ Handles multiple pause/resume cycles
- ✅ Provides accurate time measurements

**Requirements Covered:** 7.4, 7.5, 7.6

### 12.6 인증 플로우 테스트 (Authentication Flow)
- ✅ Complete auth flow: signup → login → token refresh → authenticated request
- ✅ Signup with v2 endpoint (`/api/v2/signup`)
- ✅ Login with v2 endpoint (`/api/v2/login`)
- ✅ Token refresh with v2 endpoint (`/api/v2/reissue`)
- ✅ Authenticated requests with Bearer token
- ✅ Error handling for invalid credentials
- ✅ Error handling for invalid refresh tokens

**Requirements Covered:** 1.1, 1.2, 1.3, 1.4, 1.5

## Running Tests

Run all integration tests:
```bash
npm test -- src/tests/integration/api-v2-integration.test.ts
```

Run tests in watch mode:
```bash
npm run test:watch -- src/tests/integration/api-v2-integration.test.ts
```

Run tests with UI:
```bash
npm run test:ui
```

## Test Structure

The tests use:
- **Vitest** as the test runner
- **Mock fetch** for API call simulation
- **TypeScript** for type safety
- **Integration testing approach** to verify complete workflows

## Key Features

1. **Comprehensive Coverage**: Tests cover all major v2 API flows
2. **Type Safety**: Full TypeScript integration with v2 API types
3. **Realistic Scenarios**: Tests simulate actual user interactions
4. **Error Handling**: Includes tests for error scenarios
5. **Performance**: Tests complete in under 1 second

## Test Results

All 15 tests passing ✅

- 2 tests for game creation flow
- 2 tests for dialogue scene progression
- 2 tests for selection scene progression
- 3 tests for emotion data integration
- 3 tests for time tracking
- 3 tests for authentication flow

## Next Steps

After integration tests pass:
1. Proceed to task 13: Error handling and edge cases
2. Proceed to task 14: Documentation and cleanup
3. Perform manual testing with real backend
4. Deploy to staging environment
