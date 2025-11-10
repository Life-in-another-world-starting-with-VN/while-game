import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import * as gameServiceV2 from '../services/gameServiceV2';
import * as emotionUtils from '../utils/emotionUtils';
import type {
  CreateGameRequest,
  CreateGameResponse,
  NextSceneResponse,
  SceneData,
  EmotionData,
} from '../types/api-v2';

// Mock dependencies
vi.mock('../services/gameServiceV2');
vi.mock('../utils/emotionUtils');
vi.mock('../store/AuthContext', () => ({
  useAuth: () => ({
    accessToken: 'mock-access-token',
  }),
}));

const mockCreateGame = vi.mocked(gameServiceV2.createGame);
const mockGenerateNextScene = vi.mocked(gameServiceV2.generateNextScene);
const mockGenerateSceneAfterSelection = vi.mocked(gameServiceV2.generateSceneAfterSelection);
const mockGetDefaultEmotionData = vi.mocked(emotionUtils.getDefaultEmotionData);

describe('useGameState', () => {
  const mockEmotionData: EmotionData = {
    angry: 0,
    disgust: 0,
    fear: 0,
    happy: 100,
    sad: 0,
    surprise: 0,
    neutral: 0,
  };

  const mockDialogueScene: SceneData = {
    role: 'narrator',
    scene_id: 1,
    type: 'dialogue',
    dialogue: 'Welcome to the game!',
    selections: undefined,
    character_filename: null,
  };

  const mockSelectionsScene: SceneData = {
    role: 'character',
    scene_id: 2,
    type: 'selections',
    dialogue: 'What will you do?',
    selections: {
      '1': 'Go left',
      '2': 'Go right',
    },
    character_filename: 'char1.png',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDefaultEmotionData.mockReturnValue({
      angry: 0,
      disgust: 0,
      fear: 0,
      happy: 0,
      sad: 0,
      surprise: 0,
      neutral: 100,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('게임 생성 플로우', () => {
    it('should create a new game and initialize state', async () => {
      const request: CreateGameRequest = {
        personality: 'brave',
        genre: 'fantasy',
        playtime: 30,
      };

      const response: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: 'https://example.com/bg.jpg',
          },
        ],
      };

      mockCreateGame.mockResolvedValueOnce(response);

      const { result } = renderHook(() => useGameState());

      expect(result.current.gameState.gameId).toBeNull();
      expect(result.current.gameState.isLoading).toBe(false);

      await act(async () => {
        await result.current.createNewGame(request);
      });

      expect(mockCreateGame).toHaveBeenCalledWith(request, 'mock-access-token');
      expect(result.current.gameState.gameId).toBe(123);
      expect(result.current.gameState.sessionId).toBe(1);
      expect(result.current.gameState.currentSceneId).toBe(1);
      expect(result.current.gameState.scenes).toEqual([mockDialogueScene]);
      expect(result.current.gameState.backgroundUrl).toBe('https://example.com/bg.jpg');
      expect(result.current.gameState.isLoading).toBe(false);
      expect(result.current.gameState.error).toBeNull();
    });

    it('should start time tracking when game is created', async () => {
      const request: CreateGameRequest = {
        personality: 'brave',
        genre: 'fantasy',
        playtime: 30,
      };

      const response: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      mockCreateGame.mockResolvedValueOnce(response);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame(request);
      });

      // Advance time by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeTracker.getElapsedSeconds()).toBe(5);
    });

    it('should handle game creation error', async () => {
      const request: CreateGameRequest = {
        personality: 'brave',
        genre: 'fantasy',
        playtime: 30,
      };

      const error = new Error('Network error');
      mockCreateGame.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useGameState());

      await expect(
        act(async () => {
          await result.current.createNewGame(request);
        })
      ).rejects.toThrow('Network error');

      // After error, loading should be false
      expect(result.current.gameState.isLoading).toBe(false);
    });

    it('should handle missing session data error', async () => {
      const request: CreateGameRequest = {
        personality: 'brave',
        genre: 'fantasy',
        playtime: 30,
      };

      const response: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [],
      };

      mockCreateGame.mockResolvedValueOnce(response);

      const { result } = renderHook(() => useGameState());

      await expect(
        act(async () => {
          await result.current.createNewGame(request);
        })
      ).rejects.toThrow();

      // Game should not be initialized
      expect(result.current.gameState.gameId).toBeNull();
    });
  });

  describe('dialogue 타입 씬 진행', () => {
    it('should proceed to next dialogue scene', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      const nextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Updated content',
        scenes: [
          {
            role: 'narrator',
            scene_id: 2,
            type: 'dialogue',
            dialogue: 'The adventure continues...',
            selections: undefined,
            character_filename: null,
          },
        ],
        background_url: null,
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);
      mockGenerateNextScene.mockResolvedValueOnce(nextSceneResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      await act(async () => {
        await result.current.proceedToNextScene(mockEmotionData);
      });

      expect(mockGenerateNextScene).toHaveBeenCalledWith(
        123,
        1,
        1,
        {
          emotion: mockEmotionData,
          time: 3,
        },
        'mock-access-token'
      );
      expect(result.current.gameState.currentSceneId).toBe(2);
      expect(result.current.gameState.scenes[0].dialogue).toBe('The adventure continues...');
    });

    it('should use default emotion data when not provided', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      const nextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Updated content',
        scenes: [mockDialogueScene],
        background_url: null,
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);
      mockGenerateNextScene.mockResolvedValueOnce(nextSceneResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      await act(async () => {
        await result.current.proceedToNextScene();
      });

      expect(mockGetDefaultEmotionData).toHaveBeenCalled();
      expect(mockGenerateNextScene).toHaveBeenCalledWith(
        123,
        1,
        1,
        expect.objectContaining({
          emotion: expect.objectContaining({ neutral: 100 }),
        }),
        'mock-access-token'
      );
    });

    it('should throw error when trying to proceed from non-dialogue scene', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockSelectionsScene],
            background_url: null,
          },
        ],
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      await expect(
        act(async () => {
          await result.current.proceedToNextScene(mockEmotionData);
        })
      ).rejects.toThrow();
    });

    it('should handle network error during scene progression', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);
      mockGenerateNextScene.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      await expect(
        act(async () => {
          await result.current.proceedToNextScene(mockEmotionData);
        })
      ).rejects.toThrow('Network error');

      // Scene should not have changed
      expect(result.current.gameState.currentSceneId).toBe(1);
    });
  });

  describe('selections 타입 씬 진행', () => {
    it('should proceed to next scene after selection', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockSelectionsScene],
            background_url: null,
          },
        ],
      };

      const nextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Updated content',
        scenes: [
          {
            role: 'narrator',
            scene_id: 3,
            type: 'dialogue',
            dialogue: 'You went left!',
            selections: undefined,
            character_filename: null,
          },
        ],
        background_url: null,
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);
      mockGenerateSceneAfterSelection.mockResolvedValueOnce(nextSceneResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await act(async () => {
        await result.current.selectChoice(1, mockEmotionData);
      });

      expect(mockGenerateSceneAfterSelection).toHaveBeenCalledWith(
        123,
        1,
        2,
        1,
        {
          emotion: mockEmotionData,
          time: 5,
        },
        'mock-access-token'
      );
      expect(result.current.gameState.currentSceneId).toBe(3);
      expect(result.current.gameState.scenes[0].dialogue).toBe('You went left!');
    });

    it('should validate selection ID exists in current scene', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockSelectionsScene],
            background_url: null,
          },
        ],
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      // Try to select invalid choice ID
      await expect(
        act(async () => {
          await result.current.selectChoice(999, mockEmotionData);
        })
      ).rejects.toThrow();
    });

    it('should throw error when trying to select from non-selections scene', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      await expect(
        act(async () => {
          await result.current.selectChoice(1, mockEmotionData);
        })
      ).rejects.toThrow();
    });

    it('should use default emotion data when not provided for selection', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockSelectionsScene],
            background_url: null,
          },
        ],
      };

      const nextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Updated content',
        scenes: [mockDialogueScene],
        background_url: null,
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);
      mockGenerateSceneAfterSelection.mockResolvedValueOnce(nextSceneResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      await act(async () => {
        await result.current.selectChoice(1);
      });

      expect(mockGetDefaultEmotionData).toHaveBeenCalled();
      expect(mockGenerateSceneAfterSelection).toHaveBeenCalledWith(
        123,
        1,
        2,
        1,
        expect.objectContaining({
          emotion: expect.objectContaining({ neutral: 100 }),
        }),
        'mock-access-token'
      );
    });
  });

  describe('씬 타입 감지', () => {
    it('should detect dialogue scene type', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      expect(result.current.hasChoices()).toBe(false);
      expect(result.current.getCurrentScene()?.type).toBe('dialogue');
    });

    it('should detect selections scene type', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockSelectionsScene],
            background_url: null,
          },
        ],
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      expect(result.current.hasChoices()).toBe(true);
      expect(result.current.getCurrentScene()?.type).toBe('selections');
    });

    it('should return null for getCurrentScene when no scenes exist', () => {
      const { result } = renderHook(() => useGameState());

      expect(result.current.getCurrentScene()).toBeNull();
    });
  });

  describe('시간 추적 통합', () => {
    it('should track elapsed time during gameplay', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      const nextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Updated content',
        scenes: [mockDialogueScene],
        background_url: null,
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);
      mockGenerateNextScene.mockResolvedValueOnce(nextSceneResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      // Advance time by 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      await act(async () => {
        await result.current.proceedToNextScene(mockEmotionData);
      });

      expect(mockGenerateNextScene).toHaveBeenCalledWith(
        123,
        1,
        1,
        expect.objectContaining({
          time: 10,
        }),
        'mock-access-token'
      );
    });

    it('should reset time tracker when creating new game', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      mockCreateGame.mockResolvedValue(createResponse);

      const { result } = renderHook(() => useGameState());

      // Create first game
      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(15000);
      });

      expect(result.current.timeTracker.getElapsedSeconds()).toBe(15);

      // Create new game
      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      // Time should be reset
      expect(result.current.timeTracker.getElapsedSeconds()).toBe(0);
    });

    it('should continue tracking time across multiple scene progressions', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      const nextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Updated content',
        scenes: [mockDialogueScene],
        background_url: null,
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);
      mockGenerateNextScene.mockResolvedValue(nextSceneResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      // First progression after 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await act(async () => {
        await result.current.proceedToNextScene(mockEmotionData);
      });

      expect(mockGenerateNextScene).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ time: 5 }),
        expect.anything()
      );

      // Second progression after another 7 seconds
      act(() => {
        vi.advanceTimersByTime(7000);
      });

      await act(async () => {
        await result.current.proceedToNextScene(mockEmotionData);
      });

      expect(mockGenerateNextScene).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ time: 12 }),
        expect.anything()
      );
    });
  });

  describe('감정 데이터 통합', () => {
    it('should send emotion data with scene progression', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      const nextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Updated content',
        scenes: [mockDialogueScene],
        background_url: null,
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);
      mockGenerateNextScene.mockResolvedValueOnce(nextSceneResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      const customEmotion: EmotionData = {
        angry: 10,
        disgust: 5,
        fear: 15,
        happy: 60,
        sad: 5,
        surprise: 5,
        neutral: 0,
      };

      await act(async () => {
        await result.current.proceedToNextScene(customEmotion);
      });

      expect(mockGenerateNextScene).toHaveBeenCalledWith(
        123,
        1,
        1,
        expect.objectContaining({
          emotion: customEmotion,
        }),
        'mock-access-token'
      );
    });

    it('should send emotion data with selection', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockSelectionsScene],
            background_url: null,
          },
        ],
      };

      const nextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Updated content',
        scenes: [mockDialogueScene],
        background_url: null,
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);
      mockGenerateSceneAfterSelection.mockResolvedValueOnce(nextSceneResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      const customEmotion: EmotionData = {
        angry: 0,
        disgust: 0,
        fear: 80,
        happy: 0,
        sad: 20,
        surprise: 0,
        neutral: 0,
      };

      await act(async () => {
        await result.current.selectChoice(1, customEmotion);
      });

      expect(mockGenerateSceneAfterSelection).toHaveBeenCalledWith(
        123,
        1,
        2,
        1,
        expect.objectContaining({
          emotion: customEmotion,
        }),
        'mock-access-token'
      );
    });

    it('should use default emotion data when emotion is null', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      const nextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Updated content',
        scenes: [mockDialogueScene],
        background_url: null,
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);
      mockGenerateNextScene.mockResolvedValueOnce(nextSceneResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      await act(async () => {
        await result.current.proceedToNextScene(null);
      });

      expect(mockGetDefaultEmotionData).toHaveBeenCalled();
    });
  });

  describe('helper functions', () => {
    it('should check if current scene is last scene', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene, mockSelectionsScene],
            background_url: null,
          },
        ],
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      expect(result.current.isLastScene()).toBe(false);
      expect(result.current.gameState.currentSceneIndex).toBe(0);
    });

    it('should reset game state', async () => {
      const createResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'Epic Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1 content',
            scenes: [mockDialogueScene],
            background_url: null,
          },
        ],
      };

      mockCreateGame.mockResolvedValueOnce(createResponse);

      const { result } = renderHook(() => useGameState());

      await act(async () => {
        await result.current.createNewGame({
          personality: 'brave',
          genre: 'fantasy',
          playtime: 30,
        });
      });

      expect(result.current.gameState.gameId).toBe(123);

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.gameState.gameId).toBeNull();
      expect(result.current.gameState.sessionId).toBeNull();
      expect(result.current.gameState.scenes).toEqual([]);
      expect(result.current.timeTracker.getElapsedSeconds()).toBe(0);
    });
  });
});
