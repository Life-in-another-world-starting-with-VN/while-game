import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGame, generateNextScene, generateSceneAfterSelection } from './gameServiceV2';
import { ApiError } from './api';
import type {
  CreateGameRequest,
  CreateGameResponse,
  NextSceneRequest,
  NextSceneResponse,
  EmotionData,
  SceneData,
  SessionData,
} from '../types/api-v2';

// Mock the api module
vi.mock('./api', async () => {
  const actual = await vi.importActual('./api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

// Import the mocked apiRequest
import { apiRequest } from './api';
const mockApiRequest = vi.mocked(apiRequest);

describe('gameServiceV2', () => {
  const mockToken = 'test.access.token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to create mock emotion data
  const createMockEmotionData = (): EmotionData => ({
    angry: 10,
    disgust: 5,
    fear: 15,
    happy: 60,
    sad: 5,
    surprise: 5,
    neutral: 0,
  });

  // Helper function to create mock scene data
  const createMockDialogueScene = (sceneId: number): SceneData => ({
    role: 'narrator',
    scene_id: sceneId,
    type: 'dialogue',
    dialogue: 'This is a test dialogue.',
    character_filename: 'character1.png',
  });

  const createMockSelectionScene = (sceneId: number): SceneData => ({
    role: 'character',
    scene_id: sceneId,
    type: 'selections',
    dialogue: 'Choose your path.',
    selections: {
      '1': 'Go left',
      '2': 'Go right',
      '3': 'Stay here',
    },
    character_filename: 'character2.png',
  });

  describe('createGame', () => {
    it('should successfully create a game with initial session data', async () => {
      const request: CreateGameRequest = {
        personality: 'brave',
        genre: 'fantasy',
        playtime: 30,
      };

      const mockSession: SessionData = {
        session_id: 1,
        content: 'Chapter 1: The Beginning',
        scenes: [createMockDialogueScene(1)],
        background_url: 'https://example.com/bg1.jpg',
      };

      const expectedResponse: CreateGameResponse = {
        game_id: 123,
        personality: 'brave',
        genre: 'fantasy',
        title: 'The Brave Adventure',
        playtime: 30,
        sessions: [mockSession],
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await createGame(request, mockToken);

      expect(mockApiRequest).toHaveBeenCalledWith('/api/v2/game', {
        method: 'POST',
        body: request,
        token: mockToken,
      });
      expect(result).toEqual(expectedResponse);
      expect(result.game_id).toBe(123);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].scenes).toHaveLength(1);
    });

    it('should handle game creation with multiple sessions', async () => {
      const request: CreateGameRequest = {
        personality: 'curious',
        genre: 'mystery',
        playtime: 60,
      };

      const expectedResponse: CreateGameResponse = {
        game_id: 456,
        personality: 'curious',
        genre: 'mystery',
        title: 'Mystery Quest',
        playtime: 60,
        sessions: [
          {
            session_id: 1,
            content: 'Session 1',
            scenes: [createMockDialogueScene(1)],
            background_url: 'https://example.com/bg1.jpg',
          },
          {
            session_id: 2,
            content: 'Session 2',
            scenes: [createMockDialogueScene(2)],
            background_url: 'https://example.com/bg2.jpg',
          },
        ],
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await createGame(request, mockToken);

      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].session_id).toBe(1);
      expect(result.sessions[1].session_id).toBe(2);
    });

    it('should handle game creation with empty sessions array', async () => {
      const request: CreateGameRequest = {
        personality: 'calm',
        genre: 'slice-of-life',
        playtime: 15,
      };

      const expectedResponse: CreateGameResponse = {
        game_id: 789,
        personality: 'calm',
        genre: 'slice-of-life',
        title: 'Peaceful Days',
        playtime: 15,
        sessions: [],
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await createGame(request, mockToken);

      expect(result.sessions).toHaveLength(0);
    });

    it('should throw ApiError for unauthorized game creation', async () => {
      const request: CreateGameRequest = {
        personality: 'brave',
        genre: 'fantasy',
        playtime: 30,
      };

      const error = new ApiError('Unauthorized', 401);
      mockApiRequest.mockRejectedValue(error);

      await expect(createGame(request, 'invalid.token')).rejects.toThrow(ApiError);
      await expect(createGame(request, 'invalid.token')).rejects.toThrow('Unauthorized');
    });

    it('should throw ApiError for validation errors', async () => {
      const request: CreateGameRequest = {
        personality: '',
        genre: '',
        playtime: -1,
      };

      const error = new ApiError('Validation failed', 422, {
        detail: [
          { msg: 'Personality is required' },
          { msg: 'Genre is required' },
          { msg: 'Playtime must be positive' },
        ],
      });
      mockApiRequest.mockRejectedValue(error);

      await expect(createGame(request, mockToken)).rejects.toThrow(ApiError);
      await expect(createGame(request, mockToken)).rejects.toThrow('Validation failed');
    });

    it('should throw ApiError for network errors', async () => {
      const request: CreateGameRequest = {
        personality: 'brave',
        genre: 'fantasy',
        playtime: 30,
      };

      const error = new ApiError('네트워크 오류가 발생했습니다.');
      mockApiRequest.mockRejectedValue(error);

      await expect(createGame(request, mockToken)).rejects.toThrow(ApiError);
      await expect(createGame(request, mockToken)).rejects.toThrow('네트워크 오류가 발생했습니다.');
    });
  });

  describe('generateNextScene (dialogue type)', () => {
    it('should successfully generate next scene for dialogue progression', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Chapter 1: Continued',
        scenes: [createMockDialogueScene(2)],
        background_url: 'https://example.com/bg1.jpg',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(mockApiRequest).toHaveBeenCalledWith(
        `/api/v2/game/${gameId}/${sessionId}/${sceneId}`,
        {
          method: 'POST',
          body: request,
          token: mockToken,
        }
      );
      expect(result).toEqual(expectedResponse);
      expect(result.scenes).toHaveLength(1);
      expect(result.scenes[0].type).toBe('dialogue');
    });

    it('should handle dialogue progression with multiple scenes', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 5;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 120,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Multiple scenes',
        scenes: [
          createMockDialogueScene(6),
          createMockDialogueScene(7),
          createMockSelectionScene(8),
        ],
        background_url: 'https://example.com/bg2.jpg',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.scenes).toHaveLength(3);
      expect(result.scenes[0].scene_id).toBe(6);
      expect(result.scenes[1].scene_id).toBe(7);
      expect(result.scenes[2].scene_id).toBe(8);
      expect(result.scenes[2].type).toBe('selections');
    });

    it('should send emotion data with all required fields', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const emotion: EmotionData = {
        angry: 20,
        disgust: 10,
        fear: 30,
        happy: 5,
        sad: 25,
        surprise: 5,
        neutral: 5,
      };
      const request: NextSceneRequest = {
        emotion,
        time: 60,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Next scene',
        scenes: [createMockDialogueScene(2)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(mockApiRequest).toHaveBeenCalledWith(
        `/api/v2/game/${gameId}/${sessionId}/${sceneId}`,
        {
          method: 'POST',
          body: {
            emotion: {
              angry: 20,
              disgust: 10,
              fear: 30,
              happy: 5,
              sad: 25,
              surprise: 5,
              neutral: 5,
            },
            time: 60,
          },
          token: mockToken,
        }
      );
    });

    it('should handle scene progression with zero elapsed time', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 0,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Immediate progression',
        scenes: [createMockDialogueScene(2)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result).toEqual(expectedResponse);
    });

    it('should throw ApiError for invalid scene ID', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 999;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const error = new ApiError('Scene not found', 404);
      mockApiRequest.mockRejectedValue(error);

      await expect(
        generateNextScene(gameId, sessionId, sceneId, request, mockToken)
      ).rejects.toThrow(ApiError);
      await expect(
        generateNextScene(gameId, sessionId, sceneId, request, mockToken)
      ).rejects.toThrow('Scene not found');
    });

    it('should throw ApiError for unauthorized access', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const error = new ApiError('Unauthorized', 401);
      mockApiRequest.mockRejectedValue(error);

      await expect(
        generateNextScene(gameId, sessionId, sceneId, request, 'invalid.token')
      ).rejects.toThrow(ApiError);
      await expect(
        generateNextScene(gameId, sessionId, sceneId, request, 'invalid.token')
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw ApiError for network errors', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const error = new ApiError('네트워크 오류가 발생했습니다.');
      mockApiRequest.mockRejectedValue(error);

      await expect(
        generateNextScene(gameId, sessionId, sceneId, request, mockToken)
      ).rejects.toThrow(ApiError);
      await expect(
        generateNextScene(gameId, sessionId, sceneId, request, mockToken)
      ).rejects.toThrow('네트워크 오류가 발생했습니다.');
    });
  });

  describe('generateSceneAfterSelection (selections type)', () => {
    it('should successfully generate next scene after selection', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 5;
      const selectionId = 2;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 90,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'After choice',
        scenes: [createMockDialogueScene(6)],
        background_url: 'https://example.com/bg3.jpg',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateSceneAfterSelection(
        gameId,
        sessionId,
        sceneId,
        selectionId,
        request,
        mockToken
      );

      expect(mockApiRequest).toHaveBeenCalledWith(
        `/api/v2/game/${gameId}/${sessionId}/${sceneId}/selection/${selectionId}`,
        {
          method: 'POST',
          body: request,
          token: mockToken,
        }
      );
      expect(result).toEqual(expectedResponse);
      expect(result.scenes).toHaveLength(1);
    });

    it('should handle selection with different choice IDs', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 10;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 120,
      };

      // Test selection ID 1
      const response1: NextSceneResponse = {
        session_id: 1,
        content: 'Path 1',
        scenes: [createMockDialogueScene(11)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(response1);

      const result1 = await generateSceneAfterSelection(
        gameId,
        sessionId,
        sceneId,
        1,
        request,
        mockToken
      );

      expect(result1.content).toBe('Path 1');

      // Test selection ID 3
      const response2: NextSceneResponse = {
        session_id: 1,
        content: 'Path 3',
        scenes: [createMockDialogueScene(13)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(response2);

      const result2 = await generateSceneAfterSelection(
        gameId,
        sessionId,
        sceneId,
        3,
        request,
        mockToken
      );

      expect(result2.content).toBe('Path 3');
    });

    it('should handle selection leading to multiple scenes', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 15;
      const selectionId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 180,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Complex path',
        scenes: [
          createMockDialogueScene(16),
          createMockDialogueScene(17),
          createMockSelectionScene(18),
        ],
        background_url: 'https://example.com/bg4.jpg',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateSceneAfterSelection(
        gameId,
        sessionId,
        sceneId,
        selectionId,
        request,
        mockToken
      );

      expect(result.scenes).toHaveLength(3);
      expect(result.scenes[0].type).toBe('dialogue');
      expect(result.scenes[1].type).toBe('dialogue');
      expect(result.scenes[2].type).toBe('selections');
    });

    it('should send emotion and time data with selection', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 20;
      const selectionId = 2;
      const emotion: EmotionData = {
        angry: 5,
        disgust: 5,
        fear: 10,
        happy: 70,
        sad: 0,
        surprise: 10,
        neutral: 0,
      };
      const request: NextSceneRequest = {
        emotion,
        time: 240,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Happy path',
        scenes: [createMockDialogueScene(21)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      await generateSceneAfterSelection(
        gameId,
        sessionId,
        sceneId,
        selectionId,
        request,
        mockToken
      );

      expect(mockApiRequest).toHaveBeenCalledWith(
        `/api/v2/game/${gameId}/${sessionId}/${sceneId}/selection/${selectionId}`,
        {
          method: 'POST',
          body: {
            emotion: {
              angry: 5,
              disgust: 5,
              fear: 10,
              happy: 70,
              sad: 0,
              surprise: 10,
              neutral: 0,
            },
            time: 240,
          },
          token: mockToken,
        }
      );
    });

    it('should throw ApiError for invalid selection ID', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 5;
      const selectionId = 999;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 90,
      };

      const error = new ApiError('Invalid selection', 400);
      mockApiRequest.mockRejectedValue(error);

      await expect(
        generateSceneAfterSelection(gameId, sessionId, sceneId, selectionId, request, mockToken)
      ).rejects.toThrow(ApiError);
      await expect(
        generateSceneAfterSelection(gameId, sessionId, sceneId, selectionId, request, mockToken)
      ).rejects.toThrow('Invalid selection');
    });

    it('should throw ApiError for scene not found', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 999;
      const selectionId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 90,
      };

      const error = new ApiError('Scene not found', 404);
      mockApiRequest.mockRejectedValue(error);

      await expect(
        generateSceneAfterSelection(gameId, sessionId, sceneId, selectionId, request, mockToken)
      ).rejects.toThrow(ApiError);
      await expect(
        generateSceneAfterSelection(gameId, sessionId, sceneId, selectionId, request, mockToken)
      ).rejects.toThrow('Scene not found');
    });

    it('should throw ApiError for unauthorized access', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 5;
      const selectionId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 90,
      };

      const error = new ApiError('Unauthorized', 401);
      mockApiRequest.mockRejectedValue(error);

      await expect(
        generateSceneAfterSelection(gameId, sessionId, sceneId, selectionId, request, 'invalid.token')
      ).rejects.toThrow(ApiError);
      await expect(
        generateSceneAfterSelection(gameId, sessionId, sceneId, selectionId, request, 'invalid.token')
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw ApiError for network errors', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 5;
      const selectionId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 90,
      };

      const error = new ApiError('네트워크 오류가 발생했습니다.');
      mockApiRequest.mockRejectedValue(error);

      await expect(
        generateSceneAfterSelection(gameId, sessionId, sceneId, selectionId, request, mockToken)
      ).rejects.toThrow(ApiError);
      await expect(
        generateSceneAfterSelection(gameId, sessionId, sceneId, selectionId, request, mockToken)
      ).rejects.toThrow('네트워크 오류가 발생했습니다.');
    });
  });

  describe('scene type handling', () => {
    it('should correctly handle dialogue type scenes', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 30,
      };

      const dialogueScene: SceneData = {
        role: 'narrator',
        scene_id: 2,
        type: 'dialogue',
        dialogue: 'A dialogue scene',
        character_filename: null,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Dialogue content',
        scenes: [dialogueScene],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.scenes[0].type).toBe('dialogue');
      expect(result.scenes[0].dialogue).toBe('A dialogue scene');
      expect(result.scenes[0].selections).toBeUndefined();
    });

    it('should correctly handle selections type scenes', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 5;
      const selectionId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 60,
      };

      const selectionScene: SceneData = {
        role: 'character',
        scene_id: 6,
        type: 'selections',
        dialogue: 'What will you do?',
        selections: {
          '1': 'Option A',
          '2': 'Option B',
        },
        character_filename: 'char.png',
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Selection content',
        scenes: [selectionScene],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateSceneAfterSelection(
        gameId,
        sessionId,
        sceneId,
        selectionId,
        request,
        mockToken
      );

      expect(result.scenes[0].type).toBe('selections');
      expect(result.scenes[0].selections).toBeDefined();
      expect(Object.keys(result.scenes[0].selections!)).toHaveLength(2);
    });

    it('should handle mixed scene types in response', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 10;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 90,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Mixed scenes',
        scenes: [
          {
            role: 'narrator',
            scene_id: 11,
            type: 'dialogue',
            dialogue: 'First dialogue',
            character_filename: null,
          },
          {
            role: 'character',
            scene_id: 12,
            type: 'selections',
            dialogue: 'Choose wisely',
            selections: {
              '1': 'Choice 1',
              '2': 'Choice 2',
            },
            character_filename: 'char.png',
          },
          {
            role: 'narrator',
            scene_id: 13,
            type: 'dialogue',
            dialogue: 'Final dialogue',
            character_filename: null,
          },
        ],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.scenes).toHaveLength(3);
      expect(result.scenes[0].type).toBe('dialogue');
      expect(result.scenes[1].type).toBe('selections');
      expect(result.scenes[2].type).toBe('dialogue');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete game flow: create -> dialogue -> selection', async () => {
      // Step 1: Create game
      const createRequest: CreateGameRequest = {
        personality: 'brave',
        genre: 'adventure',
        playtime: 30,
      };

      const createResponse: CreateGameResponse = {
        game_id: 100,
        personality: 'brave',
        genre: 'adventure',
        title: 'Adventure Game',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Chapter 1',
            scenes: [createMockDialogueScene(1)],
            background_url: null,
          },
        ],
      };

      mockApiRequest.mockResolvedValueOnce(createResponse);

      const gameResult = await createGame(createRequest, mockToken);
      expect(gameResult.game_id).toBe(100);

      // Step 2: Progress through dialogue
      const dialogueRequest: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 30,
      };

      const dialogueResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Chapter 1',
        scenes: [createMockSelectionScene(2)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(dialogueResponse);

      const dialogueResult = await generateNextScene(
        gameResult.game_id,
        1,
        1,
        dialogueRequest,
        mockToken
      );
      expect(dialogueResult.scenes[0].type).toBe('selections');

      // Step 3: Make a selection
      const selectionRequest: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 60,
      };

      const selectionResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Chapter 1',
        scenes: [createMockDialogueScene(3)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(selectionResponse);

      const selectionResult = await generateSceneAfterSelection(
        gameResult.game_id,
        1,
        2,
        1,
        selectionRequest,
        mockToken
      );
      expect(selectionResult.scenes[0].scene_id).toBe(3);
      expect(mockApiRequest).toHaveBeenCalledTimes(3);
    });

    it('should handle session transitions', async () => {
      const gameId = 200;
      const sessionId = 1;
      const sceneId = 50;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 300,
      };

      // Response with new session
      const expectedResponse: NextSceneResponse = {
        session_id: 2, // New session
        content: 'Chapter 2',
        scenes: [createMockDialogueScene(1)],
        background_url: 'https://example.com/chapter2.jpg',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.session_id).toBe(2);
      expect(result.content).toBe('Chapter 2');
    });

    it('should handle background URL changes', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 10;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 120,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'New location',
        scenes: [createMockDialogueScene(11)],
        background_url: 'https://example.com/new-background.jpg',
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.background_url).toBe('https://example.com/new-background.jpg');
    });

    it('should handle null background URL', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 10;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 120,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'No background',
        scenes: [createMockDialogueScene(11)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.background_url).toBeNull();
    });
  });

  describe('error status code handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      const request: CreateGameRequest = {
        personality: 'brave',
        genre: 'fantasy',
        playtime: 30,
      };

      const error = new ApiError('Bad request', 400);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await createGame(request, mockToken).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(400);
    });

    it('should handle 401 Unauthorized errors', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const error = new ApiError('Unauthorized', 401);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await generateNextScene(
        gameId,
        sessionId,
        sceneId,
        request,
        mockToken
      ).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(401);
    });

    it('should handle 403 Forbidden errors', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 5;
      const selectionId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 90,
      };

      const error = new ApiError('Forbidden', 403);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await generateSceneAfterSelection(
        gameId,
        sessionId,
        sceneId,
        selectionId,
        request,
        mockToken
      ).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(403);
    });

    it('should handle 404 Not Found errors', async () => {
      const gameId = 999;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const error = new ApiError('Not found', 404);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await generateNextScene(
        gameId,
        sessionId,
        sceneId,
        request,
        mockToken
      ).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(404);
    });

    it('should handle 422 Validation errors', async () => {
      const request: CreateGameRequest = {
        personality: '',
        genre: '',
        playtime: -1,
      };

      const error = new ApiError('Validation error', 422);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await createGame(request, mockToken).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(422);
    });

    it('should handle 500 Internal Server errors', async () => {
      const request: CreateGameRequest = {
        personality: 'brave',
        genre: 'fantasy',
        playtime: 30,
      };

      const error = new ApiError('Internal server error', 500);
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await createGame(request, mockToken).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBe(500);
    });

    it('should handle errors without status code', async () => {
      const request: CreateGameRequest = {
        personality: 'brave',
        genre: 'fantasy',
        playtime: 30,
      };

      const error = new ApiError('Network error');
      mockApiRequest.mockRejectedValue(error);

      const thrownError = await createGame(request, mockToken).catch(e => e);
      expect(thrownError).toBeInstanceOf(ApiError);
      expect(thrownError.status).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty scenes array in response', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'End of content',
        scenes: [],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.scenes).toHaveLength(0);
    });

    it('should handle scene with null dialogue', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Scene content',
        scenes: [
          {
            role: 'narrator',
            scene_id: 2,
            type: 'dialogue',
            dialogue: null,
            character_filename: null,
          },
        ],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.scenes[0].dialogue).toBeNull();
    });

    it('should handle scene with null character_filename', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Scene content',
        scenes: [
          {
            role: 'narrator',
            scene_id: 2,
            type: 'dialogue',
            dialogue: 'Some dialogue',
            character_filename: null,
          },
        ],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.scenes[0].character_filename).toBeNull();
    });

    it('should handle large time values', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 999999,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Long play session',
        scenes: [createMockDialogueScene(2)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result).toEqual(expectedResponse);
    });

    it('should handle extreme emotion values', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const emotion: EmotionData = {
        angry: 100,
        disgust: 0,
        fear: 100,
        happy: 0,
        sad: 100,
        surprise: 0,
        neutral: 0,
      };
      const request: NextSceneRequest = {
        emotion,
        time: 60,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Extreme emotions',
        scenes: [createMockDialogueScene(2)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result).toEqual(expectedResponse);
    });

    it('should handle selections with empty options object', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Scene content',
        scenes: [
          {
            role: 'character',
            scene_id: 2,
            type: 'selections',
            dialogue: 'No choices available',
            selections: {},
            character_filename: null,
          },
        ],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.scenes[0].selections).toEqual({});
    });

    it('should handle very long content strings', async () => {
      const gameId = 123;
      const sessionId = 1;
      const sceneId = 1;
      const request: NextSceneRequest = {
        emotion: createMockEmotionData(),
        time: 45,
      };

      const longContent = 'A'.repeat(10000);
      const expectedResponse: NextSceneResponse = {
        session_id: 1,
        content: longContent,
        scenes: [createMockDialogueScene(2)],
        background_url: null,
      };

      mockApiRequest.mockResolvedValueOnce(expectedResponse);

      const result = await generateNextScene(gameId, sessionId, sceneId, request, mockToken);

      expect(result.content).toBe(longContent);
      expect(result.content.length).toBe(10000);
    });
  });
});
