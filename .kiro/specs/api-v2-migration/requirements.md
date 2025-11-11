# Requirements Document

## Introduction

이 문서는 현재 v1 API를 v2 API로 마이그레이션하는 작업의 요구사항을 정의합니다. v2 API는 인증 엔드포인트를 포함한 모든 API가 `/api/v2/`로 변경되었으며, 게임 플레이 로직이 완전히 재설계되었습니다. 기존의 복잡한 구조(games, story, sessions 분리)에서 단순화된 게임 중심 구조로 변경되었고, 감정 인식 및 시간 추적 기능이 추가되었습니다.

## Requirements

### Requirement 1

**User Story:** 개발자로서, 인증 API를 v2 엔드포인트로 업데이트하고 싶습니다. 그래야 백엔드의 새로운 API 버전과 호환되면서 사용자 로그인/회원가입 기능이 작동할 수 있습니다.

#### Acceptance Criteria

1. WHEN 회원가입 요청이 발생하면 THEN 시스템은 `/api/v2/signup` 엔드포인트를 사용해야 합니다
2. WHEN 로그인 요청이 발생하면 THEN 시스템은 `/api/v2/login` 엔드포인트를 사용해야 합니다
3. WHEN 토큰 재발급 요청이 발생하면 THEN 시스템은 `/api/v2/reissue` 엔드포인트를 사용해야 합니다
4. WHEN 토큰 기반 인증이 필요한 요청이 발생하면 THEN 시스템은 기존 Bearer 토큰 방식을 유지해야 합니다
5. WHEN 인증 응답이 수신되면 THEN 시스템은 `access_token`과 `refresh_token`을 올바르게 처리해야 합니다

### Requirement 2

**User Story:** 개발자로서, 게임 생성 API를 v2로 마이그레이션하고 싶습니다. 그래야 새로운 게임 생성 플로우와 세션 기반 구조를 사용할 수 있습니다.

#### Acceptance Criteria

1. WHEN 게임 생성 요청이 발생하면 THEN 시스템은 `/api/v2/game` 엔드포인트를 사용해야 합니다
2. WHEN 게임 생성 요청을 보낼 때 THEN 시스템은 `personality`, `genre`, `playtime` 필드를 포함해야 합니다
3. WHEN 게임 생성 응답이 수신되면 THEN 시스템은 `game_id`, `title`, `sessions` 배열을 포함한 응답을 처리해야 합니다
4. WHEN 게임이 생성되면 THEN 시스템은 응답에 포함된 초기 세션 데이터를 저장해야 합니다
5. WHEN 세션 데이터가 수신되면 THEN 시스템은 `session_id`, `content`, `scenes`, `background_url`을 올바르게 파싱해야 합니다

### Requirement 3

**User Story:** 개발자로서, 씬 타입에 따라 적절한 API 엔드포인트를 선택하고 싶습니다. 그래야 대화형 씬과 선택지 씬을 올바르게 처리할 수 있습니다.

#### Acceptance Criteria

1. WHEN 씬 데이터를 받으면 THEN 시스템은 `type` 필드를 확인하여 씬 타입을 판단해야 합니다
2. WHEN 씬 타입이 `dialogue`이면 THEN 시스템은 다음 씬 진행 시 `/api/v2/game/{game_id}/{session_id}/{scene_id}` 엔드포인트를 사용해야 합니다
3. WHEN 씬 타입이 `selections`이면 THEN 시스템은 사용자가 선택지를 선택한 후 `/api/v2/game/{game_id}/{session_id}/{scene_id}/selection/{selection_id}` 엔드포인트를 사용해야 합니다
4. WHEN 씬 진행 요청을 보낼 때 THEN 시스템은 `emotion` 객체(angry, disgust, fear, happy, sad, surprise, neutral)와 `time`(초 단위)을 포함해야 합니다
5. WHEN 감정 데이터를 전송할 때 THEN 각 감정 값은 0-100 사이의 정수여야 합니다
6. WHEN 씬 응답이 수신되면 THEN 시스템은 `session_id`, `content`, `scenes` 배열, `background_url`을 처리해야 합니다
7. WHEN 씬 데이터를 파싱할 때 THEN 시스템은 `role`, `scene_id`, `type`, `dialogue`, `selections`, `character_filename` 필드를 올바르게 처리해야 합니다

### Requirement 4

**User Story:** 개발자로서, 대화형 씬을 자동으로 진행하고 싶습니다. 그래야 선택지가 없는 일반 대화 씬에서 사용자가 클릭하면 다음 씬으로 넘어갈 수 있습니다.

#### Acceptance Criteria

1. WHEN 현재 씬의 `type`이 `dialogue`이면 THEN 시스템은 선택지 없이 다음 씬으로 진행할 수 있어야 합니다
2. WHEN 대화형 씬에서 다음 씬을 요청하면 THEN 시스템은 `/api/v2/game/{game_id}/{session_id}/{scene_id}` 엔드포인트를 호출해야 합니다
3. WHEN 대화형 씬 진행 요청을 보낼 때 THEN 시스템은 현재 씬의 `scene_id`를 경로 파라미터로 사용해야 합니다
4. WHEN 대화형 씬 응답이 수신되면 THEN 시스템은 다음 씬 데이터를 화면에 표시해야 합니다
5. WHEN 대화형 씬이 연속으로 나타나면 THEN 시스템은 각 씬마다 사용자 입력을 기다려야 합니다

### Requirement 5

**User Story:** 개발자로서, 선택지 씬에서 사용자의 선택을 처리하고 싶습니다. 그래야 사용자가 선택한 옵션에 따라 스토리가 분기될 수 있습니다.

#### Acceptance Criteria

1. WHEN 현재 씬의 `type`이 `selections`이면 THEN 시스템은 `selections` 객체의 선택지들을 UI에 표시해야 합니다
2. WHEN 사용자가 선택지를 선택하면 THEN 시스템은 선택한 선택지의 ID를 추출해야 합니다
3. WHEN 선택지 선택 후 다음 씬을 요청하면 THEN 시스템은 `/api/v2/game/{game_id}/{session_id}/{scene_id}/selection/{selection_id}` 엔드포인트를 호출해야 합니다
4. WHEN 선택지 ID를 전송할 때 THEN 시스템은 정수 타입의 selection_id를 경로 파라미터로 사용해야 합니다
5. WHEN 선택지 선택 응답이 수신되면 THEN 시스템은 선택에 따른 다음 씬 데이터를 화면에 표시해야 합니다
6. WHEN `selections` 객체를 파싱할 때 THEN 시스템은 key를 선택지 ID로, value를 선택지 텍스트로 처리해야 합니다

### Requirement 6

**User Story:** 개발자로서, 기존 v1 API 서비스 레이어를 v2로 리팩토링하고 싶습니다. 그래야 코드베이스가 새로운 API 구조를 반영하고 유지보수가 용이해집니다.

#### Acceptance Criteria

1. WHEN v1 서비스 파일이 존재하면 THEN 시스템은 이를 v2 구조로 업데이트하거나 새로운 v2 서비스 파일을 생성해야 합니다
2. WHEN 타입 정의가 필요하면 THEN 시스템은 v2 API 스키마에 맞는 TypeScript 인터페이스를 생성해야 합니다
3. WHEN 기존 컴포넌트가 v1 API를 사용하면 THEN 시스템은 v2 API 호출로 변경해야 합니다
4. IF v1과 v2의 데이터 구조가 다르면 THEN 시스템은 어댑터 함수를 제공하여 기존 컴포넌트와의 호환성을 유지해야 합니다
5. WHEN 에러 처리가 필요하면 THEN 시스템은 v2 API의 에러 응답 형식을 올바르게 처리해야 합니다

### Requirement 7

**User Story:** 개발자로서, 감정 인식 데이터와 게임 진행 시간을 v2 API 형식으로 전송하고 싶습니다. 그래야 사용자의 얼굴 표정과 플레이 시간을 게임 진행에 반영할 수 있습니다.

#### Acceptance Criteria

1. WHEN 감정 인식 시스템이 데이터를 생성하면 THEN 시스템은 이를 v2 API의 EmotionData 형식으로 변환해야 합니다
2. WHEN 감정 데이터가 없거나 감정 인식이 비활성화되면 THEN 시스템은 기본값(모든 감정 0 또는 neutral 100)을 사용해야 합니다
3. WHEN 감정 값이 범위를 벗어나면 THEN 시스템은 0-100 범위로 정규화해야 합니다
4. WHEN 게임이 시작되면 THEN 시스템은 시작 시간을 기록해야 합니다
5. WHEN 씬 진행 요청을 보낼 때 THEN 시스템은 게임 시작부터 현재까지의 경과 시간을 초 단위로 계산하여 `time` 필드에 포함해야 합니다
6. WHEN 게임이 일시정지되거나 재개되면 THEN 시스템은 실제 플레이 시간만 계산해야 합니다 (일시정지 시간 제외)

### Requirement 8

**User Story:** 개발자로서, v1에서 사용하던 불필요한 API 호출을 제거하고 싶습니다. 그래야 코드가 간결해지고 성능이 향상됩니다.

#### Acceptance Criteria

1. WHEN v1의 별도 세션 생성 API가 제거되었으면 THEN 시스템은 해당 호출을 제거하고 게임 생성 응답의 세션 데이터를 사용해야 합니다
2. WHEN v1의 별도 스토리 상태 조회 API가 제거되었으면 THEN 시스템은 씬 진행 응답에 포함된 데이터를 사용해야 합니다
3. WHEN v1의 AI 생성 API가 v2에 통합되었으면 THEN 시스템은 별도의 AI 서비스 호출을 제거해야 합니다
4. WHEN 불필요한 서비스 파일이 있으면 THEN 시스템은 이를 제거하거나 deprecated로 표시해야 합니다
