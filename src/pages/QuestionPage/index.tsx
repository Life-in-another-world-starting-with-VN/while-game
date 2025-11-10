import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './components/Card';
import QuestionBlock from './components/QuestionBlock';
import OptionButton from './components/OptionButton';
import InputBox from './components/InputBox';
import StartButton from './components/StartButton';
import { PageContainer } from './styled';
import { createGame } from '../../services/gameServiceV2';
import { useAuth } from '../../hooks/useAuth';
import type { CreateGameRequest } from '../../types/api-v2';

/**
 * QuestionPage Component (v2 API)
 * 
 * Collects user preferences for game creation and uses v2 API to create a new game.
 * After successful game creation, navigates to GamePage with game_id and session_id.
 * 
 * Flow:
 * 1. User selects location (genre) and mood (personality)
 * 2. Calls createGame() from gameServiceV2 with v2 API
 * 3. Receives CreateGameResponse with game_id and sessions array
 * 4. Extracts first session_id from sessions array
 * 5. Navigates to /Game?gameId={game_id}&sessionId={session_id}
 */
function QuestionPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
  };

  const handleStartGame = async () => {
    // Validate selections
    if (!selectedLocation) {
      setError('활동 장소를 선택해주세요.');
      return;
    }
    if (!selectedMood) {
      setError('데이트 분위기를 선택해주세요.');
      return;
    }

    try {
      setError(null);
      setIsCreating(true);

      // Prepare game creation request
      const gameRequest: CreateGameRequest = {
        personality: selectedMood,
        genre: selectedLocation,
        playtime: 30, // Default 30 minutes
      };

      // Create game using v2 API
      const response = await createGame(gameRequest, accessToken!);

      // Extract game_id and first session_id from response
      const { game_id, sessions } = response;
      
      if (!sessions || sessions.length === 0) {
        throw new Error('게임 생성에 성공했지만 세션 데이터가 없습니다.');
      }

      const firstSession = sessions[0];
      const session_id = firstSession.session_id;

      // Navigate to GamePage with game_id and session_id as query parameters
      navigate(`/Game?gameId=${game_id}&sessionId=${session_id}`);
      
    } catch (err) {
      console.error('Game creation failed:', err);
      setError(err instanceof Error ? err.message : '게임 생성에 실패했습니다.');
      setIsCreating(false);
    }
  };

  return (
    <PageContainer>
      <Card>
        <QuestionBlock title="1. 활동 장소를 선택해주세요">
          <OptionButton 
            onClick={() => handleLocationSelect('산')}
            style={{ 
              opacity: selectedLocation === '산' ? 1 : 0.6,
              border: selectedLocation === '산' ? '2px solid #ff8fb7' : 'none'
            }}
          >
            산
          </OptionButton>
          <OptionButton 
            onClick={() => handleLocationSelect('바다')}
            style={{ 
              opacity: selectedLocation === '바다' ? 1 : 0.6,
              border: selectedLocation === '바다' ? '2px solid #ff8fb7' : 'none'
            }}
          >
            바다
          </OptionButton>
          <OptionButton 
            onClick={() => handleLocationSelect('도시야경')}
            style={{ 
              opacity: selectedLocation === '도시야경' ? 1 : 0.6,
              border: selectedLocation === '도시야경' ? '2px solid #ff8fb7' : 'none'
            }}
          >
            도시야경
          </OptionButton>
        </QuestionBlock>

        <QuestionBlock title="2. 데이트 분위기를 선택해주세요">
          <OptionButton 
            color="#ffe3ec"
            onClick={() => handleMoodSelect('로맨틱')}
            style={{ 
              opacity: selectedMood === '로맨틱' ? 1 : 0.6,
              border: selectedMood === '로맨틱' ? '2px solid #ff8fb7' : 'none'
            }}
          >
            로맨틱
          </OptionButton>
          <OptionButton 
            color="#d7f5d3"
            onClick={() => handleMoodSelect('캐주얼')}
            style={{ 
              opacity: selectedMood === '캐주얼' ? 1 : 0.6,
              border: selectedMood === '캐주얼' ? '2px solid #ff8fb7' : 'none'
            }}
          >
            캐주얼
          </OptionButton>
          <OptionButton 
            color="#ffeac8"
            onClick={() => handleMoodSelect('모험적')}
            style={{ 
              opacity: selectedMood === '모험적' ? 1 : 0.6,
              border: selectedMood === '모험적' ? '2px solid #ff8fb7' : 'none'
            }}
          >
            모험적
          </OptionButton>
          <OptionButton 
            color="#e6d7ff"
            onClick={() => handleMoodSelect('문화적')}
            style={{ 
              opacity: selectedMood === '문화적' ? 1 : 0.6,
              border: selectedMood === '문화적' ? '2px solid #ff8fb7' : 'none'
            }}
          >
            문화적
          </OptionButton>
        </QuestionBlock>

        <QuestionBlock title="3. 데이트에서 꼭 해보고 싶은 것은 무엇인가요?">
          <InputBox 
            placeholder="여기에 답변을 입력해주세요..." 
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
          />
        </QuestionBlock>

        {error && (
          <div style={{ 
            color: '#ff4444', 
            marginTop: '10px', 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <StartButton 
          onClick={handleStartGame}
          disabled={isCreating}
          style={{ opacity: isCreating ? 0.6 : 1 }}
        >
          {isCreating ? '게임 생성 중...' : '게임 시작'}
        </StartButton>
      </Card>
    </PageContainer>
  );
}

export default QuestionPage;
