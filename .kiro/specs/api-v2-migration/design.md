# Design Document

## Overview

이 문서는 v1 API에서 v2 API로의 마이그레이션을 위한 설계를 정의합니다. v2 API는 게임 플레이 로직을 완전히 재설계하여 씬 기반 진행, 감정 인식, 시간 추적 기능을 통합했습니다. 이 설계는 기존 컴포넌트와의 호환성을 유지하면서 새로운 API 구조를 효율적으로 통합하는 것을 목표로 합니다.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│  (GamePage, QuestionPage, MainPage, Auth Pages)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (v2)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ authService  │  │ gameService  │  │ emotionUtils │      │
│  │   (v2)       │  │   (v2)       │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Client (api.ts)                        │
│              (Bearer Token Authentication)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (v2)                           │
│  /api/v2/signup, /api/v2/login, /api/v2/reissue            │
│  /api/v2/game, /api/v2/game/{game_id}/{session_id}/...     │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Changes

1. **통합된 게임 API**: v1의 분리된 구조(games, story, sessions)를 단일 게임 엔드포인트로 통합
2. **씬 기반 상태 관리**: 씬 ID를 중심으로 게임 진행 상태 추적
3. **감정 데이터 통합**: 모든 씬 진행 요청에 감정 데이터 포함
4. **시간 추적**: 게임 시작부터의 경과 시간을 초 단위로 추적
5. **타입 기반 라우팅**: 씬 타입(`dialogue` vs `selections`)에 따라 다른 엔드포인트 사용

## Components and Interfaces

### 1. Authentication Service (authService.ts)

v2 인증 엔드포인트를 사용하는 새로운 인증 서비스입니다.

```typescript
// src/services/authService.ts

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface ReissueRequest {
  refresh_token: string;
}

export interface ReissueResponse {
  access_token: string;
  refresh_token: string;
}

// API Functions
export async function signup(data: SignupRequest): Promise<SignupResponse>
export async function login(data: LoginRequest): Promise<LoginResponse>
export async function reissueToken(refreshToken: string): Promise<ReissueResponse>
```

**설계 결정사항:**
- v1의 `/api/v1/auth/*` → v2의 `/api/v2/*`로 변경
- 토큰 재발급 엔드포인트가 `/api/v2/reissue`로 변경됨
- 기존 Bearer 토큰 인증 방식 유지

### 2. Game Service (gameServiceV2.ts)

v2 게임 API를 위한 완전히 새로운 서비스입니다.

```typescript
// src/services/gameServiceV2.ts

export interface CreateGameRequest {
  personality: string;
  genre: string;
  playtime: number;
}

export interface SceneData {
  role: string;
  scene_id: number;
  type: 'dialogue' | 'selections';
  dialogue?: string | null;
  selections?: Record<string, string>; // key: selection_id, value: selection_text
  character_filename?: string | null;
}

export interface SessionData {
  session_id: number;
  content: string;
  scenes: SceneData[];
  background_url?: string | null;
}

export interface CreateGameResponse {
  game_id: number;
  personality: string;
  genre: string;
  title: string;
  playtime: number;
  sessions: SessionData[];
}

export interface EmotionData {
  angry: number;    // 0-100
  disgust: number;  // 0-100
  fear: number;     // 0-100
  happy: number;    // 0-100
  sad: number;      // 0-100
  surprise: number; // 0-100
  neutral: number;  // 0-100
}

export interface NextSceneRequest {
  emotion: EmotionData;
  time: number; // 초 단위
}

export interface NextSceneResponse {
  session_id: number;
  content: string;
  scenes: SceneData[];
  background_url?: string | null;
}

// API Functions
export async function createGame(data: CreateGameRequest, token: string): Promise<CreateGameResponse>
export async function generateNextScene(
  gameId: number,
  sessionId: number,
  sceneId: number,
  data: NextSceneRequest,
  token: string
): Promise<NextSceneResponse>
export async function generateSceneAfterSelection(
  gameId: number,
  sessionId: number,
  sceneId: number,
  selectionId: number,
  data: NextSceneRequest,
  token: string
): Promise<NextSceneResponse>
```

**설계 결정사항:**
- 게임 생성 시 세션이 자동으로 포함되어 반환됨
- 씬 타입에 따라 다른 함수 사용 (`generateNextScene` vs `generateSceneAfterSelection`)
- 모든 씬 진행 요청에 감정 데이터와 시간 포함
- ID 타입이 string에서 number로 변경됨

### 3. Emotion Utilities (emotionUtils.ts)

감정 인식 데이터를 v2 API 형식으로 변환하는 유틸리티입니다.

```typescript
// src/utils/emotionUtils.ts

export interface RawEmotionData {
  [key: string]: number;
}

export interface EmotionData {
  angry: number;
  disgust: number;
  fear: number;
  happy: number;
  sad: number;
  surprise: number;
  neutral: number;
}

// 감정 데이터를 v2 API 형식으로 변환
export function normalizeEmotionData(raw: RawEmotionData | null): EmotionData

// 기본 감정 데이터 (neutral 100)
export function getDefaultEmotionData(): EmotionData

// 감정 값을 0-100 범위로 정규화
export function clampEmotionValue(value: number): number
```

**설계 결정사항:**
- 기존 감정 인식 시스템의 출력을 v2 API 형식으로 변환
- 감정 데이터가 없을 경우 기본값 제공 (neutral: 100, 나머지: 0)
- 모든 감정 값을 0-100 범위로 정규화

### 4. Game Time Tracker (gameTimeTracker.ts)

게임 진행 시간을 추적하는 유틸리티입니다.

```typescript
// src/utils/gameTimeTracker.ts

export class GameTimeTracker {
  private startTime: number | null = null;
  private pausedTime: number = 0;
  private lastPauseStart: number | null = null;

  // 게임 시작
  start(): void

  // 게임 일시정지
  pause(): void

  // 게임 재개
  resume(): void

  // 현재 경과 시간 (초 단위)
  getElapsedSeconds(): number

  // 리셋
  reset(): void
}
```

**설계 결정사항:**
- 게임 시작부터의 실제 플레이 시간만 계산 (일시정지 시간 제외)
- 초 단위로 시간 반환
- 싱글톤 패턴 또는 React Context로 관리

### 5. Game State Manager (useGameState.ts)

게임 상태를 관리하는 커스텀 훅입니다.

```typescript
// src/hooks/useGameState.ts

export interface GameState {
  gameId: number | null;
  sessionId: number | null;
  currentSceneId: number | null;
  scenes: SceneData[];
  currentSceneIndex: number;
  backgroundUrl: string | null;
  timeTracker: GameTimeTracker;
}

export interface UseGameStateReturn {
  gameState: GameState;
  createNewGame: (data: CreateGameRequest) => Promise<void>;
  proceedToNextScene: (emotion: EmotionData) => Promise<void>;
  selectChoice: (selectionId: number, emotion: EmotionData) => Promise<void>;
  getCurrentScene: () => SceneData | null;
  isLastScene: () => boolean;
  hasChoices: () => boolean;
}

export function useGameState(): UseGameStateReturn
```

**설계 결정사항:**
- 게임 상태를 중앙에서 관리
- 씬 타입에 따라 자동으로 적절한 API 호출
- 시간 추적 통합
- 에러 처리 및 로딩 상태 관리

## Data Models

### v1 vs v2 Data Structure Comparison

#### Game Creation

**v1:**
```typescript
// Request
{
  personality: string;
  genre: string;
  playtime: number;
}

// Response
{
  id: string;
  title: string;
  description: string | null;
  personality: string;
  genre: string;
  playtime: number;
  creator_id: string;
  is_published: boolean | null;
}
```

**v2:**
```typescript
// Request (동일)
{
  personality: string;
  genre: string;
  playtime: number;
}

// Response (세션 포함)
{
  game_id: number;
  personality: string;
  genre: string;
  title: string;
  playtime: number;
  sessions: SessionData[];
}
```

**주요 변경사항:**
- ID 타입: string → number
- 세션이 자동으로 생성되어 응답에 포함
- 불필요한 필드 제거 (description, creator_id, is_published)

#### Scene Progression

**v1:**
```typescript
// 별도의 엔드포인트들
POST /api/v1/story/start/{gameId}
GET /api/v1/story/state/{gameId}
POST /api/v1/story/choice/{gameId}?dialogue_id={}&choice_id={}
```

**v2:**
```typescript
// 통합된 씬 진행 엔드포인트
POST /api/v2/game/{game_id}/{session_id}/{scene_id}
POST /api/v2/game/{game_id}/{session_id}/{scene_id}/selection/{selection_id}

// Request (공통)
{
  emotion: EmotionData;
  time: number;
}

// Response (공통)
{
  session_id: number;
  content: string;
  scenes: SceneData[];
  background_url?: string | null;
}
```

**주요 변경사항:**
- 씬 ID 기반 진행으로 변경
- 감정 데이터와 시간 추적 추가
- 씬 타입에 따라 엔드포인트 분기
- 응답에 여러 씬이 배열로 포함됨

## Error Handling

### Error Types

```typescript
export class ApiError extends Error {
  status?: number;
  data?: unknown;
  
  constructor(message: string, status?: number, data?: unknown)
}

export class GameStateError extends Error {
  code: 'INVALID_SCENE' | 'MISSING_SESSION' | 'INVALID_CHOICE';
  
  constructor(message: string, code: string)
}
```

### Error Handling Strategy

1. **네트워크 에러**: 재시도 로직 구현 (최대 3회)
2. **인증 에러 (401)**: 자동 토큰 재발급 시도
3. **유효성 검증 에러 (422)**: 사용자에게 명확한 메시지 표시
4. **서버 에러 (500)**: 에러 로그 기록 및 사용자에게 일반 메시지 표시
5. **게임 상태 에러**: 게임 상태 복구 또는 재시작 제안

## Testing Strategy

### Unit Tests

1. **Service Layer Tests**
   - API 요청/응답 형식 검증
   - 에러 처리 검증
   - 토큰 인증 검증

2. **Utility Tests**
   - 감정 데이터 변환 검증
   - 시간 추적 정확성 검증
   - 데이터 정규화 검증

3. **Hook Tests**
   - 게임 상태 관리 로직 검증
   - 씬 진행 로직 검증
   - 에러 상태 처리 검증

### Integration Tests

1. **게임 생성 플로우**
   - 게임 생성 → 세션 자동 생성 → 첫 씬 표시

2. **대화형 씬 진행**
   - 씬 타입 확인 → 다음 씬 요청 → 상태 업데이트

3. **선택지 씬 진행**
   - 선택지 표시 → 선택 → 다음 씬 요청 → 상태 업데이트

4. **감정 인식 통합**
   - 감정 데이터 수집 → 변환 → API 전송

5. **시간 추적**
   - 게임 시작 → 시간 경과 → 일시정지/재개 → 정확한 시간 전송

### Manual Testing Checklist

- [ ] 회원가입 및 로그인 (v2 엔드포인트)
- [ ] 토큰 재발급 (v2 엔드포인트)
- [ ] 게임 생성 및 세션 자동 생성
- [ ] 대화형 씬 진행
- [ ] 선택지 씬 진행
- [ ] 감정 인식 데이터 전송
- [ ] 게임 시간 추적
- [ ] 에러 처리 (네트워크, 인증, 유효성 검증)
- [ ] 기존 컴포넌트와의 호환성

## Migration Strategy

### Phase 1: Service Layer Migration

1. 새로운 v2 서비스 파일 생성
   - `authService.ts` (v2 인증)
   - `gameServiceV2.ts` (v2 게임)
   - `emotionUtils.ts` (감정 데이터 변환)
   - `gameTimeTracker.ts` (시간 추적)

2. 기존 v1 서비스 파일 유지 (호환성)
   - `gameService.ts` → deprecated 표시
   - `storyService.ts` → deprecated 표시
   - `sessionService.ts` → deprecated 표시
   - `aiService.ts` → deprecated 표시

### Phase 2: State Management Migration

1. 새로운 게임 상태 관리 훅 생성
   - `useGameState.ts` (v2 게임 상태)

2. AuthContext 업데이트
   - v2 토큰 재발급 엔드포인트 사용

### Phase 3: Component Migration

1. GamePage 컴포넌트 업데이트
   - v2 서비스 사용
   - 씬 타입 기반 라우팅
   - 감정 데이터 통합
   - 시간 추적 통합

2. QuestionPage 컴포넌트 업데이트 (게임 생성)
   - v2 게임 생성 API 사용

3. Auth 컴포넌트 업데이트
   - v2 인증 API 사용

### Phase 4: Cleanup

1. v1 서비스 파일 제거
2. 사용하지 않는 타입 정의 제거
3. 문서 업데이트

## Backward Compatibility

### Adapter Pattern

기존 컴포넌트가 v1 데이터 구조를 기대하는 경우, 어댑터 함수를 제공합니다.

```typescript
// src/utils/apiAdapters.ts

// v2 SceneData를 v1 Dialogue 형식으로 변환
export function sceneToDialogue(scene: SceneData): Dialogue

// v2 SessionData를 v1 StoryState 형식으로 변환
export function sessionToStoryState(session: SessionData): StoryState
```

**사용 시나리오:**
- 기존 컴포넌트를 즉시 마이그레이션할 수 없는 경우
- 점진적 마이그레이션을 위한 임시 호환성 레이어

## Performance Considerations

1. **API 호출 최적화**
   - 불필요한 API 호출 제거 (v1의 별도 상태 조회 제거)
   - 응답 캐싱 (세션 데이터)

2. **상태 관리 최적화**
   - 씬 데이터를 메모리에 캐싱
   - 불필요한 리렌더링 방지

3. **감정 인식 최적화**
   - 감정 데이터 수집 주기 조정
   - 디바운싱 적용

4. **시간 추적 최적화**
   - 고정밀 타이머 사용
   - 메모리 누수 방지

## Security Considerations

1. **토큰 관리**
   - Access Token: 메모리에만 저장
   - Refresh Token: localStorage에 저장 (HttpOnly 쿠키 권장)
   - 토큰 만료 시 자동 재발급

2. **API 요청 보안**
   - HTTPS 사용 강제
   - CORS 설정 확인
   - XSS 방지 (입력 데이터 검증)

3. **감정 데이터 보안**
   - 민감한 감정 데이터 암호화 전송
   - 서버 측 데이터 검증

## Deployment Plan

1. **개발 환경 테스트**
   - v2 API 엔드포인트 연결
   - 전체 플로우 테스트

2. **스테이징 환경 배포**
   - 통합 테스트
   - 성능 테스트

3. **프로덕션 배포**
   - 점진적 롤아웃 (Feature Flag)
   - 모니터링 및 에러 추적

4. **롤백 계획**
   - v1 서비스 파일 유지
   - Feature Flag로 즉시 롤백 가능
