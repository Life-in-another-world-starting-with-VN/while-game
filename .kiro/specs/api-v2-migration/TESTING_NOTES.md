# Testing Notes for API v2 Migration

## Task 9: QuestionPage Component Update

### Implementation Summary
- Updated QuestionPage to use v2 gameServiceV2.createGame()
- Handles CreateGameResponse with sessions array
- Navigates to GamePage with game_id and session_id query parameters

### Manual Testing Steps

1. **Navigate to QuestionPage**
   - Go to `/Quest` route
   - Verify the page loads with three question sections

2. **Test Selection UI**
   - Click on location options (산, 바다, 도시야경)
   - Verify selected option is highlighted with border
   - Click on mood options (로맨틱, 캐주얼, 모험적, 문화적)
   - Verify selected option is highlighted

3. **Test Validation**
   - Click "게임 시작" without selecting location
   - Verify error message: "활동 장소를 선택해주세요."
   - Select location, click "게임 시작" without selecting mood
   - Verify error message: "데이트 분위기를 선택해주세요."

4. **Test Game Creation**
   - Select both location and mood
   - Click "게임 시작"
   - Verify button text changes to "게임 생성 중..."
   - Verify button is disabled during creation
   - Check network tab for POST request to `/api/v2/game`
   - Verify request body contains:
     ```json
     {
       "personality": "<selected mood>",
       "genre": "<selected location>",
       "playtime": 30
     }
     ```

5. **Test Navigation**
   - After successful game creation, verify navigation to `/Game?gameId={id}&sessionId={id}`
   - Verify both gameId and sessionId are present in URL
   - Verify GamePage loads with the created game

6. **Test Error Handling**
   - Test with invalid/expired token
   - Verify error message is displayed
   - Verify button is re-enabled after error

### Expected API Response Structure
```typescript
{
  game_id: number,
  personality: string,
  genre: string,
  title: string,
  playtime: number,
  sessions: [
    {
      session_id: number,
      content: string,
      scenes: SceneData[],
      background_url?: string | null
    }
  ]
}
```

### Integration Points
- **Service**: `gameServiceV2.createGame()`
- **Auth**: Uses `accessToken` from `useAuth()` hook
- **Navigation**: Uses `useNavigate()` from react-router-dom
- **Types**: Uses `CreateGameRequest` from `types/api-v2.ts`

### Requirements Covered
- ✅ 2.1: Uses `/api/v2/game` endpoint
- ✅ 2.2: Sends `personality`, `genre`, `playtime` fields
- ✅ 2.3: Processes `game_id`, `title`, `sessions` array from response
- ✅ 2.4: Stores initial session data (passed via URL)
- ✅ 2.5: Parses `session_id`, `content`, `scenes`, `background_url`
