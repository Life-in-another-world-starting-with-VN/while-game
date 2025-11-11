import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import { theme } from '../../styles';
import { useGameState } from '../../hooks/useGameState';
import { normalizeEmotionData, getDefaultEmotionData } from '../../utils/emotionUtils';
import { useEmotionDetection } from '../../hooks/useEmotionDetection';
import DialogueBox from './components/DialogueBox';
import GameMenu from './components/GameMenu';
import ChoiceButtons from './components/ChoiceButtons';
import AutoPlayModal from './components/AutoPlayModal';
import CharacterSprite from './components/CharacterSprite';
import DialogueLogModal from './components/DialogueLogModal';
import { mockMenuItems } from './data/mockGameData';
import type { MenuAction } from '../../types/game';
import EmotionStatusWidget from '../../components/EmotionStatusWidget';
import { detectEmotion } from '../../utils/emotionDetector';
import { getCharacterIdFromName } from '../../utils/characterAssets';
import type { CharacterExpression, CharacterId } from '../../types/character';
import type { CreateGameRequest, EmotionData as V2EmotionData, SceneData } from '../../types/api-v2';

interface GamePageProps {
  backgroundImage?: string;
}

const Container = styled.div<{ $backgroundImage?: string }>`
  width: 100%;
  height: 100vh;
  background: ${props =>
    props.$backgroundImage
      ? `url(${props.$backgroundImage}) center/cover no-repeat`
      : '#000000'
  };
  position: relative;
  font-family: ${theme.typography.fontFamily};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  ${theme.media.mobile} {
    min-height: 100vh;
    height: auto;
  }
`;

const LoadingScreen = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;
  color: #ffffff;
  font-size: 1.5rem;
`;

const GameSetupScreen = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #B1DEF7 0%, #E4E8EB 100%);;
  padding: 2rem;
`;

const SetupCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const SetupTitle = styled.h1`
  margin: 0 0 2rem 0;
  font-size: 2rem;
  color: #1a202c;
  text-align: center;
`;

const FormField = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #4a5568;
`;

const InputHint = styled.div`
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #718096;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;



const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  &:hover {
    background: #5a67d8;
  }

  &:active {
    transform: translateY(2px);
  }

  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }
`;



const BackButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #718096;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  margin-top: 1rem;
  width: 100%;

  &:hover {
    background: #4a5568;
  }

  &:active {
    transform: translateY(2px);
  }

  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background: #fed7d7;
  color: #c53030;
  border-radius: 12px;
  margin-bottom: 1rem;
  text-align: center;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  margin-top: 1.5rem;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
`;

const LoadingSubtext = styled.div`
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const ConfirmModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ConfirmCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ConfirmTitle = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: #1a202c;
  text-align: center;
`;

const ConfirmMessage = styled.p`
  margin: 0 0 2rem 0;
  color: #4a5568;
  text-align: center;
  line-height: 1.6;
`;

const ConfirmButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

const ConfirmButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 0.875rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${props =>
    props.variant === 'primary'
      ? `
    background: #667eea;
    color: white;
    &:hover {
      background: #5a67d8;
    }
  `
      : `
    background: #e2e8f0;
    color: #4a5568;
    &:hover {
      background: #cbd5e0;
    }
  `}

  &:active {
    transform: translateY(2px);
  }
`;

const ClickableOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  cursor: pointer;
`;

const PinkBlurOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(102, 102, 102, 0.04) 0%,
    rgba(252, 161, 199, 0.4) 100%
  );
  pointer-events: none;
  z-index: 0;
`;

const LoadingDialogueBox = styled.div`
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 85%;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.lg};
  padding: ${theme.spacing.xl};
  z-index: 2;

  ${theme.media.tablet} {
    bottom: 18%;
    padding: ${theme.spacing.lg};
    gap: ${theme.spacing.md};
  }

  ${theme.media.mobile} {
    bottom: 20%;
    padding: ${theme.spacing.md};
  }
`;

const LoadingDialogueText = styled.div`
  color: ${theme.colors.white};
  font-size: ${theme.typography.sizes.option};
  font-family: ${theme.typography.fontFamily};
  font-weight: ${theme.typography.weights.regular};
  line-height: 1.4;
  text-align: center;
  -webkit-text-stroke: 2px black;
  paint-order: stroke fill;
  text-shadow:
    3px 3px 0 #000,
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;

  ${theme.media.tablet} {
    font-size: ${theme.typography.sizes.subOption};
    -webkit-text-stroke: 1.5px black;
  }

  ${theme.media.mobile} {
    font-size: ${theme.typography.sizes.button};
    -webkit-text-stroke: 1px black;
  }
`;

const LoadingDots = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  
  span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${theme.colors.main};
    animation: bounce 1.4s infinite ease-in-out both;
    box-shadow: 0 0 8px ${theme.colors.main};

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }

    ${theme.media.mobile} {
      width: 10px;
      height: 10px;
    }
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

interface DialogueLogItem {
  characterName: string;
  characterColor?: string;
  text: string;
}

type GameSetupMode = 'create' | 'playing';

const GamePage: React.FC<GamePageProps> = ({ backgroundImage }) => {
  const [searchParams] = useSearchParams();
  const gameIdParam = searchParams.get('gameId');

  // Use v2 game state hook
  const {
    gameState,
    createNewGame,
    proceedToNextScene,
    selectChoice,
    getCurrentScene,
    isLastScene,
  } = useGameState();

  // Emotion detection hook
  const { expression: emotionExpression } = useEmotionDetection();

  const [mode, setMode] = useState<GameSetupMode>('create');
  const [error, setError] = useState<string | null>(null);

  // Game creation state
  const [gameForm, setGameForm] = useState<CreateGameRequest>({
    personality: '',
    genre: '',
    playtime: 30, // 기본값 30분
  });
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  // Scene navigation state
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [dialogueLog, setDialogueLog] = useState<DialogueLogItem[]>([]);
  const [previousDialogueScene, setPreviousDialogueScene] = useState<SceneData | null>(null);

  // Modal states
  const [isAutoPlayModalOpen, setIsAutoPlayModalOpen] = useState(false);
  const [isDialogueLogModalOpen, setIsDialogueLogModalOpen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(3000);

  // Check if game is already loaded from URL params (future enhancement)
  useEffect(() => {
    if (gameIdParam) {
      // Future: Load existing game from URL
      // For now, just show create screen
      setMode('create');
    }
  }, [gameIdParam]);

  // Create new game using v2 API
  const handleCreateGame = async () => {
    try {
      setError(null);

      // 유효성 검사
      if (!gameForm.personality.trim()) {
        setError('성격 유형을 입력해주세요.');
        return;
      }
      if (!gameForm.genre.trim()) {
        setError('장르를 입력해주세요.');
        return;
      }
      if (gameForm.playtime < 5 || gameForm.playtime > 100) {
        setError('플레이 시간은 5분에서 100분 사이로 설정해주세요.');
        return;
      }

      setIsCreatingGame(true);

      // Create game using v2 API and initialize game state
      await createNewGame(gameForm);

      setIsCreatingGame(false);
      setShowStartConfirm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게임 생성에 실패했습니다.');
      setIsCreatingGame(false);
    }
  };

  // Start created game
  const handleStartCreatedGame = () => {
    setShowStartConfirm(false);
    setCurrentSceneIndex(0);
    setMode('playing');
  };

  // Cancel starting game
  const handleCancelStart = () => {
    setShowStartConfirm(false);
    setMode('create');
  };

  // Get current emotion data for API calls
  const getCurrentEmotionData = useCallback((): V2EmotionData => {
    // If emotion detection is available, use it
    if (emotionExpression) {
      // Map face-api emotion labels to v2 API format
      const emotionMap: Record<string, Partial<V2EmotionData>> = {
        '무표정': { neutral: 100 },
        '행복': { happy: 100 },
        '슬픔': { sad: 100 },
        '분노': { angry: 100 },
        '두려움': { fear: 100 },
        '혐오': { disgust: 100 },
        '놀람': { surprise: 100 },
      };

      const mappedEmotion = emotionMap[emotionExpression.label];
      if (mappedEmotion) {
        return normalizeEmotionData(mappedEmotion as Partial<V2EmotionData>);
      }
    }

    // Default to neutral emotion
    return getDefaultEmotionData();
  }, [emotionExpression]);

  // Navigate to next scene (for dialogue type scenes)
  const handleNextScene = useCallback(async () => {
    const currentScene = getCurrentScene();
    if (!currentScene) return;

    // Add to dialogue log
    if (currentScene.dialogue) {
      setDialogueLog(prev => [
        ...prev,
        {
          characterName: currentScene.role || '캐릭터',
          text: currentScene.dialogue || '',
        },
      ]);
    }

    // dialogue 씬이면 저장 (selections 씬에서 배경으로 사용)
    if (currentScene.type === 'dialogue') {
      setPreviousDialogueScene(currentScene);
    }

    // Check if we need to move to next scene in the array
    if (!isLastScene()) {
      // Move to next scene in current array
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      // Need to fetch next scenes from API (for dialogue type)
      if (currentScene.type === 'dialogue') {
        try {
          const emotionData = getCurrentEmotionData();
          await proceedToNextScene(emotionData);
          setCurrentSceneIndex(0);
        } catch (err) {
          setError(err instanceof Error ? err.message : '다음 씬을 불러오는데 실패했습니다.');
        }
      }
    }
  }, [getCurrentScene, isLastScene, proceedToNextScene, getCurrentEmotionData]);

  // Handle choice selection (for selection/selections type scenes)
  const handleChoiceSelect = async (choiceId: string) => {
    const currentScene = getCurrentScene();
    if (!currentScene || (currentScene.type !== 'selection' && currentScene.type !== 'selections')) return;

    try {
      const selectionId = parseInt(choiceId, 10);
      if (isNaN(selectionId)) {
        setError('잘못된 선택지입니다.');
        return;
      }

      const emotionData = getCurrentEmotionData();
      await selectChoice(selectionId, emotionData);
      setCurrentSceneIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '선택 처리에 실패했습니다.');
    }
  };

  // Handle menu actions
  const handleMenuAction = (action: MenuAction) => {
    switch (action) {
      case 'dialogueLog':
        setIsDialogueLogModalOpen(true);
        break;
      case 'skip':
        handleNextScene();
        break;
      case 'auto':
        setIsAutoPlayModalOpen(true);
        break;
      case 'quickAuto':
        setIsAutoPlayModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Auto-play effect
  useEffect(() => {
    const currentScene = getCurrentScene();
    if (isAutoPlay && currentScene && currentScene.type === 'dialogue') {
      const timer = setTimeout(() => {
        handleNextScene();
      }, autoPlaySpeed);

      return () => clearTimeout(timer);
    }
  }, [isAutoPlay, currentSceneIndex, autoPlaySpeed, getCurrentScene, handleNextScene]);

  // Render game setup screens

  if (mode === 'create') {
    return (
      <>
        <GameSetupScreen>
          <SetupCard>
            <SetupTitle>새 게임 만들기</SetupTitle>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <FormField>
              <Label>성격 유형</Label>
              <Input
                type="text"
                placeholder="예: 순수, 츤데레, 활발함, 차가움 등"
                value={gameForm.personality}
                onChange={e => setGameForm({ ...gameForm, personality: e.target.value })}
                required
                disabled={isCreatingGame}
              />
            </FormField>
            <FormField>
              <Label>장르</Label>
              <Input
                type="text"
                placeholder="예: 로맨스, 판타지, 학원물, 현대물 등"
                value={gameForm.genre}
                onChange={e => setGameForm({ ...gameForm, genre: e.target.value })}
                required
                disabled={isCreatingGame}
              />
            </FormField>
            <FormField>
              <Label>예상 플레이 시간 (분)</Label>
              <Input
                type="number"
                min="5"
                max="100"
                value={gameForm.playtime}
                onChange={e => setGameForm({ ...gameForm, playtime: parseInt(e.target.value) || 5 })}
                disabled={isCreatingGame}
              />
              <InputHint>최소 5분 ~ 최대 100분 (권장: 30~60분)</InputHint>
            </FormField>
            <Button onClick={handleCreateGame} disabled={isCreatingGame}>
              {isCreatingGame ? '생성 중...' : '게임 생성하기'}
            </Button>
            <BackButton onClick={() => window.history.back()} disabled={isCreatingGame}>
              뒤로가기
            </BackButton>
          </SetupCard>
        </GameSetupScreen>

        {/* 로딩 오버레이 */}
        {isCreatingGame && (
          <LoadingOverlay>
            <LoadingSpinner />
            <LoadingText>AI가 게임을 생성하고 있습니다...</LoadingText>
            <LoadingSubtext>
              {gameForm.playtime}분 분량의 스토리를 작성 중입니다. 잠시만 기다려주세요.
            </LoadingSubtext>
          </LoadingOverlay>
        )}

        {/* 시작 확인 모달 */}
        {showStartConfirm && (
          <ConfirmModal>
            <ConfirmCard>
              <ConfirmTitle>🎉 게임 생성 완료!</ConfirmTitle>
              <ConfirmMessage>
                게임이 성공적으로 생성되었습니다.
                <br />
                바로 시작하시겠습니까?
              </ConfirmMessage>
              <ConfirmButtons>
                <ConfirmButton variant="secondary" onClick={handleCancelStart}>
                  나중에
                </ConfirmButton>
                <ConfirmButton variant="primary" onClick={handleStartCreatedGame}>
                  시작하기
                </ConfirmButton>
              </ConfirmButtons>
            </ConfirmCard>
          </ConfirmModal>
        )}
      </>
    );
  }

  // Render gameplay
  if (mode === 'playing') {
    // Check if game has no scenes (error state)
    if (!gameState.isLoading && gameState.scenes.length === 0) {
      return (
        <LoadingScreen>
          <div>스토리 데이터가 없습니다.</div>
          <div style={{ fontSize: '1rem', marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>
            게임이 아직 생성 중이거나 데이터가 준비되지 않았습니다.
          </div>
          <ErrorMessage style={{ marginTop: '2rem' }} onClick={() => window.location.reload()}>
            새로고침
          </ErrorMessage>
        </LoadingScreen>
      );
    }

    // Get current scene (or use first scene if loading)
    const currentScene = gameState.scenes[currentSceneIndex] || gameState.scenes[0];

    // Determine if we should show choices
    const showChoices = currentScene && (currentScene.type === 'selection' || currentScene.type === 'selections') && currentScene.selections;

    // selection 씬일 때는 직전 dialogue 씬을 배경으로 사용
    const displayScene = (currentScene && showChoices && !currentScene.dialogue && previousDialogueScene)
      ? previousDialogueScene
      : currentScene;

    // Detect emotion from dialogue text or use default
    const currentExpression: CharacterExpression = displayScene?.dialogue
      ? detectEmotion(displayScene.dialogue, gameForm.personality)
      : ('neutral' as CharacterExpression);

    // Get character ID from role name for consistent character assignment
    const characterId = displayScene?.role
      ? getCharacterIdFromName(displayScene.role)
      : '1';

    // Use character_filename if provided and valid, otherwise use characterId
    const isValidCharacterId = (id: string): id is CharacterId => {
      return id === '1' || id === '2' || id === '3';
    };
    const characterImageId: CharacterId =
      displayScene?.character_filename && isValidCharacterId(displayScene.character_filename)
        ? displayScene.character_filename
        : characterId;

    // 배경 URL 처리: API에서 받은 URL이 있으면 baseURL과 결합
    const finalBackgroundUrl = gameState.backgroundUrl
      ? `${import.meta.env.VITE_API_BASE_URL || ''}${gameState.backgroundUrl}`
      : backgroundImage;

    return (
      <Container $backgroundImage={finalBackgroundUrl}>
        <PinkBlurOverlay />
        <EmotionStatusWidget />

        {!showChoices && !gameState.isLoading && <ClickableOverlay onClick={handleNextScene} />}

        {/* 캐릭터 스프라이트 표시 (나레이션과 narrator일 때는 숨김) */}
        {displayScene?.role && displayScene.role !== "나레이션" && displayScene.role !== "narrator" && (
          <CharacterSprite
            characterId={characterImageId}
            characterName={displayScene.role}
            expression={currentExpression}
          />
        )}

        {/* 로딩 중일 때 애니메이션 표시 */}
        {gameState.isLoading && (
          <LoadingDialogueBox>
            <LoadingDots>
              <span />
              <span />
              <span />
            </LoadingDots>
          </LoadingDialogueBox>
        )}

        {/* 로딩 중이 아닐 때만 대화 상자 표시 */}
        {!gameState.isLoading && displayScene?.dialogue && (
          <DialogueBox
            characterName={displayScene.role === "narrator" ? "내레이션" : (displayScene.role || "캐릭터")}
            text={displayScene.dialogue}
            onClick={handleNextScene}
          />
        )}

        {!gameState.isLoading && showChoices && currentScene.selections && (
          <ChoiceButtons
            choices={Object.entries(currentScene.selections).map(([id, text]: [string, unknown]) => ({
              id: id,
              text: String(text),
              nextSceneId: id,
            }))}
            onChoiceSelect={handleChoiceSelect}
          />
        )}

        <GameMenu menuItems={mockMenuItems} onMenuClick={handleMenuAction} />

        <AutoPlayModal
          isOpen={isAutoPlayModalOpen}
          isAutoPlaying={isAutoPlay}
          onClose={() => setIsAutoPlayModalOpen(false)}
          onSelectSpeed={speed => {
            setAutoPlaySpeed(speed);
            setIsAutoPlay(true);
          }}
          onStop={() => setIsAutoPlay(false)}
        />

        <DialogueLogModal
          isOpen={isDialogueLogModalOpen}
          onClose={() => setIsDialogueLogModalOpen(false)}
          dialogueLog={dialogueLog}
        />

        {(error || gameState.error) && (
          <ErrorMessage style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
            {error || gameState.error}
          </ErrorMessage>
        )}
      </Container>
    );
  }

  // Default: return null or create screen
  return null;
};

export default GamePage;
