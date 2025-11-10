/**
 * useGameState Hook
 * 
 * Manages game state for v2 API including:
 * - Game creation and initialization
 * - Scene progression (dialogue and selections)
 * - Time tracking integration
 * - Emotion data collection
 * - Scene type detection and routing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  createGame,
  generateNextScene,
  generateSceneAfterSelection,
} from '../services/gameServiceV2';
import { GameTimeTracker } from '../utils/gameTimeTracker';
import { getDefaultEmotionData } from '../utils/emotionUtils';
import {
  handleApiError,
  validateSessionData,
  validateSceneData,
  createMissingSessionError,
  createInvalidSceneError,
  createInvalidSceneTypeError,
  createInvalidChoiceError,
  retryWithBackoff,
} from '../utils/errorHandler';
import type {
  CreateGameRequest,
  SceneData,
  EmotionData,
} from '../types/api-v2';

/**
 * Game state interface
 */
export interface GameState {
  gameId: number | null;
  sessionId: number | null;
  currentSceneId: number | null;
  scenes: SceneData[];
  currentSceneIndex: number;
  backgroundUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Return type for useGameState hook
 */
export interface UseGameStateReturn {
  gameState: GameState;
  timeTracker: GameTimeTracker;
  createNewGame: (data: CreateGameRequest) => Promise<void>;
  proceedToNextScene: (emotion?: EmotionData | null) => Promise<void>;
  selectChoice: (selectionId: number, emotion?: EmotionData | null) => Promise<void>;
  getCurrentScene: () => SceneData | null;
  isLastScene: () => boolean;
  hasChoices: () => boolean;
  resetGame: () => void;
}

/**
 * Initial game state
 */
const initialGameState: GameState = {
  gameId: null,
  sessionId: null,
  currentSceneId: null,
  scenes: [],
  currentSceneIndex: 0,
  backgroundUrl: null,
  isLoading: false,
  error: null,
};

/**
 * Custom hook for managing game state with v2 API
 * 
 * Provides functions for:
 * - Creating new games
 * - Progressing through dialogue scenes
 * - Handling selection scenes
 * - Tracking time and emotion data
 * 
 * @returns Game state and control functions
 */
export function useGameState(): UseGameStateReturn {
  const { accessToken } = useAuth();
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const timeTrackerRef = useRef<GameTimeTracker>(new GameTimeTracker());

  // Reset time tracker when component unmounts
  useEffect(() => {
    const timeTracker = timeTrackerRef.current;
    return () => {
      timeTracker.reset();
    };
  }, []);

  /**
   * Get the current scene being displayed
   */
  const getCurrentScene = useCallback((): SceneData | null => {
    const { scenes, currentSceneIndex } = gameState;
    return scenes[currentSceneIndex] ?? null;
  }, [gameState]);

  /**
   * Create a new game and initialize state
   * Automatically starts time tracking
   */
  const createNewGame = useCallback(
    async (data: CreateGameRequest): Promise<void> => {
      if (!accessToken) {
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
      }

      setGameState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Retry game creation on network failures
        const response = await retryWithBackoff(() => createGame(data, accessToken));

        // Validate response structure
        if (!response.sessions || response.sessions.length === 0) {
          throw createMissingSessionError();
        }

        // Extract first session data
        const firstSession = response.sessions[0];
        
        // Validate session data
        if (!validateSessionData(firstSession)) {
          throw createMissingSessionError();
        }

        // Validate first scene
        if (!firstSession.scenes[0] || !validateSceneData(firstSession.scenes[0])) {
          throw createInvalidSceneError();
        }

        // Initialize game state with first session
        setGameState({
          gameId: response.game_id,
          sessionId: firstSession.session_id,
          currentSceneId: firstSession.scenes[0].scene_id,
          scenes: firstSession.scenes,
          currentSceneIndex: 0,
          backgroundUrl: firstSession.background_url ?? null,
          isLoading: false,
          error: null,
        });

        // Start time tracking
        timeTrackerRef.current.reset();
        timeTrackerRef.current.start();
      } catch (error) {
        const errorMessage = handleApiError(error);
        setGameState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [accessToken]
  );

  /**
   * Proceed to next scene for dialogue type scenes
   * Sends emotion data and elapsed time to API
   */
  const proceedToNextScene = useCallback(
    async (emotion?: EmotionData | null): Promise<void> => {
      if (!accessToken) {
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
      }

      const { gameId, sessionId, currentSceneId } = gameState;

      if (gameId === null || sessionId === null || currentSceneId === null) {
        throw createInvalidSceneError();
      }

      // Validate current scene type
      const currentScene = getCurrentScene();
      if (currentScene && currentScene.type !== 'dialogue') {
        throw createInvalidSceneTypeError(currentScene.type);
      }

      setGameState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Prepare request data
        const emotionData = emotion ?? getDefaultEmotionData();
        const elapsedTime = timeTrackerRef.current.getElapsedSeconds();

        // Retry on network failures
        const response = await retryWithBackoff(() =>
          generateNextScene(
            gameId,
            sessionId,
            currentSceneId,
            {
              emotion: emotionData,
              time: elapsedTime,
            },
            accessToken
          )
        );

        // Validate response
        if (!response.scenes || response.scenes.length === 0) {
          throw createInvalidSceneError();
        }

        // Validate first scene
        if (!validateSceneData(response.scenes[0])) {
          throw createInvalidSceneError();
        }

        // Update state with new scenes
        setGameState((prev) => ({
          ...prev,
          sessionId: response.session_id,
          scenes: response.scenes,
          currentSceneId: response.scenes[0].scene_id,
          currentSceneIndex: 0,
          backgroundUrl: response.background_url ?? prev.backgroundUrl,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        const errorMessage = handleApiError(error);
        setGameState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [accessToken, gameState, getCurrentScene]
  );

  /**
   * Select a choice in a selections type scene
   * Sends selection ID, emotion data, and elapsed time to API
   */
  const selectChoice = useCallback(
    async (selectionId: number, emotion?: EmotionData | null): Promise<void> => {
      if (!accessToken) {
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
      }

      const { gameId, sessionId, currentSceneId } = gameState;

      if (gameId === null || sessionId === null || currentSceneId === null) {
        throw createInvalidSceneError();
      }

      // Validate current scene type
      const currentScene = getCurrentScene();
      if (!currentScene) {
        throw createInvalidSceneError();
      }

      if (currentScene.type !== 'selection' && currentScene.type !== 'selections') {
        throw createInvalidSceneTypeError(currentScene.type);
      }

      // Validate selection ID exists in current scene
      if (!currentScene.selections || !(selectionId.toString() in currentScene.selections)) {
        throw createInvalidChoiceError(selectionId);
      }

      setGameState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Prepare request data
        const emotionData = emotion ?? getDefaultEmotionData();
        const elapsedTime = timeTrackerRef.current.getElapsedSeconds();

        // Retry on network failures
        const response = await retryWithBackoff(() =>
          generateSceneAfterSelection(
            gameId,
            sessionId,
            currentSceneId,
            selectionId,
            {
              emotion: emotionData,
              time: elapsedTime,
            },
            accessToken
          )
        );

        // Validate response
        if (!response.scenes || response.scenes.length === 0) {
          throw createInvalidSceneError();
        }

        // Validate first scene
        if (!validateSceneData(response.scenes[0])) {
          throw createInvalidSceneError();
        }

        // Update state with new scenes
        setGameState((prev) => ({
          ...prev,
          sessionId: response.session_id,
          scenes: response.scenes,
          currentSceneId: response.scenes[0].scene_id,
          currentSceneIndex: 0,
          backgroundUrl: response.background_url ?? prev.backgroundUrl,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        const errorMessage = handleApiError(error);
        setGameState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [accessToken, gameState, getCurrentScene]
  );

  /**
   * Check if current scene is the last scene in the array
   */
  const isLastScene = useCallback((): boolean => {
    const { scenes, currentSceneIndex } = gameState;
    return currentSceneIndex >= scenes.length - 1;
  }, [gameState]);

  /**
   * Check if current scene has choices (selection/selections type)
   */
  const hasChoices = useCallback((): boolean => {
    const currentScene = getCurrentScene();
    return (currentScene?.type === 'selection' || currentScene?.type === 'selections') && Boolean(currentScene.selections);
  }, [getCurrentScene]);

  /**
   * Reset game state to initial values
   */
  const resetGame = useCallback(() => {
    setGameState(initialGameState);
    timeTrackerRef.current.reset();
  }, []);

  return {
    gameState,
    timeTracker: timeTrackerRef.current,
    createNewGame,
    proceedToNextScene,
    selectChoice,
    getCurrentScene,
    isLastScene,
    hasChoices,
    resetGame,
  };
}
