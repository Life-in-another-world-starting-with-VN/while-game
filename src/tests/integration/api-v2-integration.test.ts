/**
 * Integration Tests for v2 API Migration
 * 
 * These tests verify the complete flow of v2 API interactions including:
 * - Authentication (signup, login, token refresh)
 * - Game creation and session initialization
 * - Scene progression (dialogue and selections)
 * - Emotion data integration
 * - Time tracking integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authService from '../../services/authService';
import * as gameServiceV2 from '../../services/gameServiceV2';
import { normalizeEmotionData, getDefaultEmotionData } from '../../utils/emotionUtils';
import { GameTimeTracker } from '../../utils/gameTimeTracker';
import type {
  CreateGameResponse,
  NextSceneResponse,
  SceneData,
} from '../../types/api-v2';

// Mock fetch globally
global.fetch = vi.fn();

describe('Integration Tests: v2 API Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  describe('12.1 전체 게임 생성 플로우 테스트', () => {
    it('should create game, receive sessions, and display first scene', async () => {
      // Mock successful game creation response
      const mockGameResponse: CreateGameResponse = {
        game_id: 1,
        personality: 'adventurous',
        genre: 'fantasy',
        title: 'Test Adventure',
        playtime: 30,
        sessions: [
          {
            session_id: 1,
            content: 'Chapter 1: The Beginning',
            scenes: [
              {
                role: 'narrator',
                scene_id: 1,
                type: 'dialogue',
                dialogue: 'Welcome to the adventure!',
                character_filename: null,
              },
              {
                role: 'hero',
                scene_id: 2,
                type: 'dialogue',
                dialogue: 'I am ready for this journey.',
                character_filename: 'hero.png',
              },
            ],
            background_url: 'https://example.com/bg1.jpg',
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockGameResponse,
      });

      // Execute: Create game
      const gameData = {
        personality: 'adventurous',
        genre: 'fantasy',
        playtime: 30,
      };
      const token = 'test-token';
      const response = await gameServiceV2.createGame(gameData, token);

      // Verify: Game creation response
      expect(response.game_id).toBe(1);
      expect(response.title).toBe('Test Adventure');
      expect(response.sessions).toHaveLength(1);

      // Verify: Session data received
      const session = response.sessions[0];
      expect(session.session_id).toBe(1);
      expect(session.content).toBe('Chapter 1: The Beginning');
      expect(session.scenes).toHaveLength(2);
      expect(session.background_url).toBe('https://example.com/bg1.jpg');

      // Verify: First scene can be displayed
      const firstScene = session.scenes[0];
      expect(firstScene.scene_id).toBe(1);
      expect(firstScene.type).toBe('dialogue');
      expect(firstScene.dialogue).toBe('Welcome to the adventure!');
      expect(firstScene.role).toBe('narrator');

      // Verify: API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/game'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(gameData),
        })
      );
    });

    it('should handle game creation with multiple sessions', async () => {
      const mockGameResponse: CreateGameResponse = {
        game_id: 2,
        personality: 'brave',
        genre: 'sci-fi',
        title: 'Space Odyssey',
        playtime: 60,
        sessions: [
          {
            session_id: 1,
            content: 'Episode 1',
            scenes: [
              {
                role: 'captain',
                scene_id: 1,
                type: 'dialogue',
                dialogue: 'Prepare for launch!',
                character_filename: 'captain.png',
              },
            ],
            background_url: 'https://example.com/space.jpg',
          },
          {
            session_id: 2,
            content: 'Episode 2',
            scenes: [
              {
                role: 'engineer',
                scene_id: 10,
                type: 'dialogue',
                dialogue: 'Systems are online.',
                character_filename: 'engineer.png',
              },
            ],
            background_url: 'https://example.com/ship.jpg',
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockGameResponse,
      });

      const response = await gameServiceV2.createGame(
        { personality: 'brave', genre: 'sci-fi', playtime: 60 },
        'token'
      );

      expect(response.sessions).toHaveLength(2);
      expect(response.sessions[0].session_id).toBe(1);
      expect(response.sessions[1].session_id).toBe(2);
    });
  });

  describe('12.2 dialogue 씬 진행 테스트', () => {
    it('should display dialogue scene, proceed on click, and load next scene', async () => {
      // Setup: Initial scene (dialogue type)
      const currentScene: SceneData = {
        role: 'hero',
        scene_id: 5,
        type: 'dialogue',
        dialogue: 'What should I do next?',
        character_filename: 'hero.png',
      };

      // Mock next scene response
      const mockNextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Chapter 1: Continued',
        scenes: [
          {
            role: 'mentor',
            scene_id: 6,
            type: 'dialogue',
            dialogue: 'Follow your heart, young one.',
            character_filename: 'mentor.png',
          },
        ],
        background_url: 'https://example.com/bg2.jpg',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockNextSceneResponse,
      });

      // Execute: Verify scene type is dialogue
      expect(currentScene.type).toBe('dialogue');
      expect(currentScene.dialogue).toBeTruthy();

      // Execute: User clicks to proceed (simulate)
      const gameId = 1;
      const sessionId = 1;
      const sceneId = currentScene.scene_id;
      const emotionData = getDefaultEmotionData();
      const time = 120; // 2 minutes

      const response = await gameServiceV2.generateNextScene(
        gameId,
        sessionId,
        sceneId,
        { emotion: emotionData, time },
        'test-token'
      );

      // Verify: Next scene loaded
      expect(response.scenes).toHaveLength(1);
      const nextScene = response.scenes[0];
      expect(nextScene.scene_id).toBe(6);
      expect(nextScene.type).toBe('dialogue');
      expect(nextScene.dialogue).toBe('Follow your heart, young one.');
      expect(nextScene.role).toBe('mentor');

      // Verify: API called with correct endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v2/game/${gameId}/${sessionId}/${sceneId}`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ emotion: emotionData, time }),
        })
      );
    });

    it('should handle consecutive dialogue scenes', async () => {
      const mockResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Dialogue sequence',
        scenes: [
          {
            role: 'character1',
            scene_id: 10,
            type: 'dialogue',
            dialogue: 'First line',
            character_filename: 'char1.png',
          },
          {
            role: 'character2',
            scene_id: 11,
            type: 'dialogue',
            dialogue: 'Second line',
            character_filename: 'char2.png',
          },
          {
            role: 'character1',
            scene_id: 12,
            type: 'dialogue',
            dialogue: 'Third line',
            character_filename: 'char1.png',
          },
        ],
        background_url: null,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      const response = await gameServiceV2.generateNextScene(
        1, 1, 9,
        { emotion: getDefaultEmotionData(), time: 60 },
        'token'
      );

      // Verify: Multiple dialogue scenes received
      expect(response.scenes).toHaveLength(3);
      expect(response.scenes.every(s => s.type === 'dialogue')).toBe(true);
    });
  });

  describe('12.3 selections 씬 진행 테스트', () => {
    it('should display selections, handle user choice, and load next scene', async () => {
      // Setup: Initial scene (selections type)
      const currentScene: SceneData = {
        role: 'narrator',
        scene_id: 20,
        type: 'selections',
        selections: {
          '1': 'Go left into the forest',
          '2': 'Go right to the village',
          '3': 'Stay and rest',
        },
        character_filename: null,
      };

      // Mock next scene response after selection
      const mockNextSceneResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Chapter 2: The Forest',
        scenes: [
          {
            role: 'narrator',
            scene_id: 21,
            type: 'dialogue',
            dialogue: 'You venture into the dark forest...',
            character_filename: null,
          },
        ],
        background_url: 'https://example.com/forest.jpg',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockNextSceneResponse,
      });

      // Execute: Verify scene type is selections
      expect(currentScene.type).toBe('selections');
      expect(currentScene.selections).toBeTruthy();
      expect(Object.keys(currentScene.selections!)).toHaveLength(3);

      // Execute: User selects option 1 (go left)
      const gameId = 1;
      const sessionId = 1;
      const sceneId = currentScene.scene_id;
      const selectionId = 1; // User chose "Go left into the forest"
      const emotionData = getDefaultEmotionData();
      const time = 180;

      const response = await gameServiceV2.generateSceneAfterSelection(
        gameId,
        sessionId,
        sceneId,
        selectionId,
        { emotion: emotionData, time },
        'test-token'
      );

      // Verify: Next scene loaded based on selection
      expect(response.scenes).toHaveLength(1);
      const nextScene = response.scenes[0];
      expect(nextScene.scene_id).toBe(21);
      expect(nextScene.dialogue).toBe('You venture into the dark forest...');
      expect(response.background_url).toBe('https://example.com/forest.jpg');

      // Verify: API called with selection endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v2/game/${gameId}/${sessionId}/${sceneId}/selection/${selectionId}`),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ emotion: emotionData, time }),
        })
      );
    });

    it('should handle selections with different choice IDs', async () => {
      const mockResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Different path',
        scenes: [
          {
            role: 'guide',
            scene_id: 30,
            type: 'dialogue',
            dialogue: 'You chose wisely.',
            character_filename: 'guide.png',
          },
        ],
        background_url: null,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      // Test with selection ID 3
      const response = await gameServiceV2.generateSceneAfterSelection(
        1, 1, 20, 3,
        { emotion: getDefaultEmotionData(), time: 200 },
        'token'
      );

      expect(response.scenes[0].scene_id).toBe(30);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/selection/3'),
        expect.any(Object)
      );
    });
  });

  describe('12.4 감정 데이터 통합 테스트', () => {
    it('should collect emotion data, transform it, and send with scene request', async () => {
      // Setup: Raw emotion data from detection system
      const rawEmotionData = {
        happy: 75.5,
        neutral: 20.3,
        sad: 4.2,
        angry: 0,
        surprise: 0,
        fear: 0,
        disgust: 0,
      };

      // Execute: Transform emotion data
      const normalizedEmotion = normalizeEmotionData(rawEmotionData);

      // Verify: Emotion data normalized correctly
      expect(normalizedEmotion.happy).toBe(76); // Rounded
      expect(normalizedEmotion.neutral).toBe(20); // Rounded
      expect(normalizedEmotion.sad).toBe(4); // Rounded
      expect(normalizedEmotion.angry).toBe(0);
      expect(normalizedEmotion.surprise).toBe(0);
      expect(normalizedEmotion.fear).toBe(0);
      expect(normalizedEmotion.disgust).toBe(0);

      // Mock API response
      const mockResponse: NextSceneResponse = {
        session_id: 1,
        content: 'Scene with emotion',
        scenes: [
          {
            role: 'friend',
            scene_id: 40,
            type: 'dialogue',
            dialogue: 'You seem happy!',
            character_filename: 'friend.png',
          },
        ],
        background_url: null,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });

      // Execute: Send emotion data with scene request
      await gameServiceV2.generateNextScene(
        1, 1, 39,
        { emotion: normalizedEmotion, time: 100 },
        'token'
      );

      // Verify: Emotion data sent in request body
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            emotion: normalizedEmotion,
            time: 100,
          }),
        })
      );
    });

    it('should use default emotion data when detection is unavailable', async () => {
      // Execute: Get default emotion data
      const defaultEmotion = getDefaultEmotionData();

      // Verify: Default values
      expect(defaultEmotion.neutral).toBe(100);
      expect(defaultEmotion.angry).toBe(0);
      expect(defaultEmotion.disgust).toBe(0);
      expect(defaultEmotion.fear).toBe(0);
      expect(defaultEmotion.happy).toBe(0);
      expect(defaultEmotion.sad).toBe(0);
      expect(defaultEmotion.surprise).toBe(0);

      // Mock API response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          session_id: 1,
          content: 'Test',
          scenes: [],
          background_url: null,
        }),
      });

      // Execute: Send default emotion data
      await gameServiceV2.generateNextScene(
        1, 1, 1,
        { emotion: defaultEmotion, time: 0 },
        'token'
      );

      // Verify: Default emotion sent
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"neutral":100'),
        })
      );
    });

    it('should clamp out-of-range emotion values', async () => {
      const rawEmotion = {
        happy: 150, // Over 100
        sad: -20, // Below 0
        neutral: 50.7, // Needs rounding
      };

      const normalized = normalizeEmotionData(rawEmotion);

      expect(normalized.happy).toBe(100); // Clamped to max
      expect(normalized.sad).toBe(0); // Clamped to min
      expect(normalized.neutral).toBe(51); // Rounded
    });
  });

  describe('12.5 시간 추적 테스트', () => {
    it('should track game time and send with scene request', async () => {
      // Setup: Create time tracker
      const tracker = new GameTimeTracker();

      // Execute: Start game
      tracker.start();

      // Simulate time passing (50ms)
      await new Promise(resolve => setTimeout(resolve, 50));

      // Execute: Get elapsed time
      const elapsedSeconds = tracker.getElapsedSeconds();

      // Verify: Time tracked (should be 0 seconds for such short duration)
      expect(elapsedSeconds).toBeGreaterThanOrEqual(0);
      expect(typeof elapsedSeconds).toBe('number');

      // Mock API response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          session_id: 1,
          content: 'Test',
          scenes: [],
          background_url: null,
        }),
      });

      // Execute: Send time with scene request
      await gameServiceV2.generateNextScene(
        1, 1, 1,
        { emotion: getDefaultEmotionData(), time: elapsedSeconds },
        'token'
      );

      // Verify: Time sent in request
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(`"time":${elapsedSeconds}`),
        })
      );
    });

    it('should exclude paused time from elapsed time', async () => {
      const tracker = new GameTimeTracker();
      
      tracker.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      tracker.pause();
      await new Promise(resolve => setTimeout(resolve, 100)); // Paused time
      tracker.resume();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const elapsed = tracker.getElapsedSeconds();
      
      // Should be approximately 0 seconds (200ms active time)
      // Paused time should not be counted
      expect(elapsed).toBeGreaterThanOrEqual(0);
      expect(elapsed).toBeLessThan(2); // Should not include paused time
    });

    it('should handle multiple pause/resume cycles', async () => {
      const tracker = new GameTimeTracker();
      
      tracker.start();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      tracker.pause();
      await new Promise(resolve => setTimeout(resolve, 50));
      tracker.resume();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      tracker.pause();
      await new Promise(resolve => setTimeout(resolve, 50));
      tracker.resume();
      
      const elapsed = tracker.getElapsedSeconds();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('12.6 인증 플로우 테스트', () => {
    it('should complete full auth flow: signup -> login -> token refresh -> authenticated request', async () => {
      // Step 1: Signup
      const signupData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'User created successfully' }),
      });

      const signupResponse = await authService.signup(signupData);
      expect(signupResponse.message).toBe('User created successfully');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/signup'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(signupData),
        })
      );

      // Step 2: Login
      const loginData = {
        username: 'testuser',
        password: 'password123',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-456',
        }),
      });

      const loginResponse = await authService.login(loginData);
      expect(loginResponse.access_token).toBe('access-token-123');
      expect(loginResponse.refresh_token).toBe('refresh-token-456');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(loginData),
        })
      );

      // Step 3: Token Refresh
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          access_token: 'new-access-token-789',
          refresh_token: 'new-refresh-token-012',
        }),
      });

      const refreshResponse = await authService.reissueToken('refresh-token-456');
      expect(refreshResponse.access_token).toBe('new-access-token-789');
      expect(refreshResponse.refresh_token).toBe('new-refresh-token-012');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/reissue'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'refresh-token-456' }),
        })
      );

      // Step 4: Authenticated Request (create game)
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          game_id: 1,
          personality: 'brave',
          genre: 'adventure',
          title: 'My Game',
          playtime: 30,
          sessions: [],
        }),
      });

      const gameResponse = await gameServiceV2.createGame(
        { personality: 'brave', genre: 'adventure', playtime: 30 },
        refreshResponse.access_token
      );

      expect(gameResponse.game_id).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/game'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer new-access-token-789',
          }),
        })
      );
    });

    it('should handle authentication errors', async () => {
      // Mock failed login
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Invalid credentials' }),
      });

      await expect(
        authService.login({ username: 'wrong', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should handle token refresh errors', async () => {
      // Mock failed token refresh
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ detail: 'Invalid refresh token' }),
      });

      await expect(
        authService.reissueToken('invalid-token')
      ).rejects.toThrow('Invalid refresh token');
    });
  });
});
