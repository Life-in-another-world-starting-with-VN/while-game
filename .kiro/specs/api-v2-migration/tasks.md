# 구현 계획

- [x] 1. v2 API 타입 및 인터페이스 설정
  - v2 API 요청/응답 스키마를 위한 TypeScript 인터페이스 생성
  - EmotionData, SceneData, SessionData, CreateGameRequest/Response 타입 정의
  - 씬 진행을 위한 NextSceneRequest/Response 타입 정의
  - _요구사항: 2.2, 2.3, 2.5, 3.2, 3.5, 4.2_

- [ ] 2. 감정 데이터 유틸리티 구현
  - [x] 2.1 데이터 변환 함수가 포함된 emotionUtils.ts 생성
    - 원시 감정 데이터를 v2 형식으로 변환하는 `normalizeEmotionData()` 구현
    - 기본 감정 값을 제공하는 `getDefaultEmotionData()` 구현
    - 값을 0-100 범위로 정규화하는 `clampEmotionValue()` 구현
    - _요구사항: 7.1, 7.2, 7.3_

- [x] 2.2 감정 유틸리티 유닛 테스트 작성
    - 다양한 입력으로 감정 데이터 정규화 테스트
    - 기본 감정 데이터 생성 테스트
    - 값 클램핑 엣지 케이스 테스트
    - _요구사항: 7.1, 7.2, 7.3_

- [ ] 3. 게임 시간 추적기 구현
  - [x] 3.1 GameTimeTracker 클래스 생성
    - `start()`, `pause()`, `resume()` 메서드 구현
    - 경과 시간을 초 단위로 반환하는 `getElapsedSeconds()` 구현
    - 추적기를 리셋하는 `reset()` 구현
    - 전체 경과 시간에서 일시정지 시간 제외 처리
    - _요구사항: 7.4, 7.5, 7.6_

- [x] 3.2 시간 추적기 유닛 테스트 작성
    - 시간 추적 정확도 테스트
    - 일시정지/재개 기능 테스트
    - 일시정지 시간을 제외한 경과 시간 계산 테스트
    - _요구사항: 7.4, 7.5, 7.6_

- [x] 4. v2 인증 서비스 구현
  - [x] 4.1 v2 엔드포인트를 사용하는 authService.ts 생성
    - `/api/v2/signup`을 사용하는 `signup()` 구현
    - `/api/v2/login`을 사용하는 `login()` 구현
    - `/api/v2/reissue`를 사용하는 `reissueToken()` 구현
    - Bearer 토큰 인증과 함께 기존 `apiRequest()` 헬퍼 사용
    - _요구사항: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4.2 인증 서비스 유닛 테스트 작성
    - 회원가입 요청/응답 처리 테스트
    - 로그인 요청/응답 처리 테스트
    - 토큰 재발급 요청/응답 처리 테스트
    - 인증 실패 에러 처리 테스트
    - _요구사항: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. v2 게임 서비스 구현
  - [x] 5.1 게임 생성 기능이 포함된 gameServiceV2.ts 생성
    - `/api/v2/game`을 사용하는 `createGame()` 구현
    - sessions 배열을 포함한 CreateGameResponse 파싱
    - game_id를 number 타입으로 처리
    - _요구사항: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 dialogue 타입 씬 진행 구현
    - `/api/v2/game/{game_id}/{session_id}/{scene_id}`를 사용하는 `generateNextScene()` 구현
    - 요청 본문에 emotion과 time 포함
    - scenes 배열이 포함된 NextSceneResponse 파싱
    - _요구사항: 3.1, 3.2, 3.4, 3.6, 3.7, 4.1, 4.4_

  - [x] 5.3 selections 타입 씬 진행 구현
    - `/api/v2/game/{game_id}/{session_id}/{scene_id}/selection/{selection_id}`를 사용하는 `generateSceneAfterSelection()` 구현
    - 요청 본문에 emotion과 time 포함
    - scenes 배열이 포함된 NextSceneResponse 파싱
    - _요구사항: 3.1, 3.3, 3.4, 3.6, 3.7, 4.1, 4.2, 4.3, 4.5_

- [x] 5.4 게임 서비스 유닛 테스트 작성
    - 게임 생성 요청/응답 테스트
    - dialogue 타입 씬 진행 테스트
    - selections 타입 씬 진행 테스트
    - 잘못된 씬 타입 에러 처리 테스트
    - _요구사항: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5_

- [-] 6. 게임 상태 관리 훅 생성
  - [x] 6.1 useGameState.ts 훅 생성
    - 게임 상태 인터페이스 구현 (gameId, sessionId, currentSceneId, scenes 등)
    - 게임을 생성하고 상태를 초기화하는 `createNewGame()` 구현
    - dialogue 타입 씬을 위한 `proceedToNextScene()` 구현
    - selections 타입 씬을 위한 `selectChoice()` 구현
    - 시간 추적을 위한 GameTimeTracker 통합
    - 감정 데이터 수집 통합
    - 씬 타입 감지 및 라우팅 로직 구현
    - _요구사항: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 6.2 useGameState 훅 유닛 테스트 작성
    - 게임 생성 플로우 테스트
    - dialogue 타입 씬 진행 테스트
    - selections 타입 씬 진행 테스트
    - 씬 타입 감지 테스트
    - 시간 추적 통합 테스트
    - 감정 데이터 통합 테스트
    - _요구사항: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. v2를 위한 AuthContext 업데이트
  - REFRESH_ENDPOINT를 `/api/v2/reissue`로 업데이트
  - 리프레시 토큰 요청 본문 형식 업데이트
  - 기존 인증 플로우와의 하위 호환성 보장
  - _요구사항: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 8. v2를 위한 GamePage 컴포넌트 업데이트
  - [x] 8.1 useGameState 훅 통합
    - 직접 서비스 호출을 useGameState 훅으로 교체
    - v2 API를 사용하도록 게임 생성 플로우 업데이트
    - 게임 시작 시 GameTimeTracker 초기화
    - _요구사항: 2.1, 2.2, 2.3, 2.4, 2.5, 7.4, 7.5_

  - [x] 8.2 씬 타입 기반 라우팅 구현
    - 씬 `type` 필드를 확인하여 다음 액션 결정
    - `dialogue` 타입: `proceedToNextScene()` 호출
    - `selections` 타입: 선택지 표시 및 `selectChoice()` 호출
    - _요구사항: 3.1, 3.2, 3.3, 4.1, 4.4_

  - [x] 8.3 감정 데이터 수집 통합
    - EmotionStatusWidget 또는 useEmotionDetection 훅에서 감정 데이터 수집
    - emotionUtils를 사용하여 감정 데이터 변환
    - 씬 진행 함수에 감정 데이터 전달
    - _요구사항: 7.1, 7.2, 7.3_

  - [x] 8.4 시간 추적 통합
    - 게임 시작 시 시간 추적기 시작
    - 씬 진행 함수에 경과 시간 전달
    - 해당되는 경우 일시정지/재개 처리
    - _요구사항: 7.4, 7.5, 7.6_

  - [x] 8.5 씬 렌더링 업데이트
    - v2 SceneData 형식에서 씬 렌더링
    - `role`, `dialogue`, `selections`, `character_filename` 필드 처리
    - `background_url`에서 배경 이미지 업데이트
    - _요구사항: 2.5, 3.5, 3.7, 4.4, 4.6_

- [x] 9. v2를 위한 QuestionPage 컴포넌트 업데이트
  - v2 gameServiceV2를 사용하도록 게임 생성 업데이트
  - sessions 배열이 포함된 CreateGameResponse 처리
  - game_id와 session_id로 GamePage로 이동
  - _요구사항: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 10. v2를 위한 Auth 컴포넌트 업데이트
  - v2 authService를 사용하도록 Login 컴포넌트 업데이트
  - v2 authService를 사용하도록 Register 컴포넌트 업데이트
  - 토큰 저장 및 검색이 올바르게 작동하는지 확인
  - _요구사항: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 11. v1 서비스 deprecate 처리
  - gameService.ts에 deprecation 주석 추가
  - storyService.ts에 deprecation 주석 추가
  - sessionService.ts에 deprecation 주석 추가
  - aiService.ts에 deprecation 주석 추가
  - 주석에 마이그레이션 경로 문서화
  - _요구사항: 8.1, 8.2, 8.3, 8.4_

- [x] 12. 통합 테스트
  - [x] 12.1 전체 게임 생성 플로우 테스트
    - 게임 생성 → 세션 수신 → 첫 씬 표시
    - _요구사항: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 12.2 dialogue 씬 진행 테스트
    - dialogue 씬 표시 → 클릭하여 진행 → 다음 씬 로드
    - _요구사항: 3.1, 3.2, 3.4, 3.6, 3.7, 4.1, 4.4_

  - [x] 12.3 selections 씬 진행 테스트
    - 선택지 표시 → 선택 → 다음 씬 로드
    - _요구사항: 3.1, 3.3, 3.4, 3.6, 3.7, 4.1, 4.2, 4.3, 4.5, 4.6_

  - [x] 12.4 감정 데이터 통합 테스트
    - 감정 데이터 수집 → 변환 → 씬 요청과 함께 전송
    - _요구사항: 7.1, 7.2, 7.3_

  - [x] 12.5 시간 추적 테스트
    - 게임 시작 → 시간 추적 → 씬 요청과 함께 전송
    - _요구사항: 7.4, 7.5, 7.6_

  - [x] 12.6 인증 플로우 테스트
    - 회원가입 → 로그인 → 토큰 갱신 → 인증된 요청
    - _요구사항: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 13. 에러 처리 및 엣지 케이스
  - 네트워크 실패 에러 처리 구현
  - 잘못된 씬 타입 에러 처리 구현
  - 누락된 세션 데이터 에러 처리 구현
  - 인증 실패 에러 처리 구현
  - 사용자 친화적인 에러 메시지 추가
  - _요구사항: 6.5_

- [x] 14. 문서화 및 정리
  - v2 API 변경사항으로 README 업데이트
  - 새로운 서비스 함수 문서화
  - 감정 데이터 형식 문서화
  - 시간 추적 사용법 문서화
  - 검증 후 사용하지 않는 v1 코드 제거
  - _요구사항: 8.1, 8.2, 8.3, 8.4_
