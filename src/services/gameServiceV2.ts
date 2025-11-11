/**
 * Game Service (v2 API)
 * 
 * Handles game operations using v2 API endpoints:
 * - /api/v2/game - Game creation
 * - /api/v2/game/{game_id}/{session_id}/{scene_id} - Dialogue scene progression
 * - /api/v2/game/{game_id}/{session_id}/{scene_id}/selection/{selection_id} - Selection scene progression
 */

import { apiRequest } from './api';
import type {
  CreateGameRequest,
  CreateGameResponse,
  NextSceneRequest,
  NextSceneResponse,
} from '../types/api-v2';

/**
 * Create a new game with initial session data
 * 
 * @param data - Game creation parameters (personality, genre, playtime)
 * @param token - Authentication token
 * @returns Promise with game_id, title, and initial sessions array
 * @throws ApiError if game creation fails
 */
export async function createGame(
  data: CreateGameRequest,
  token: string
): Promise<CreateGameResponse> {
  return apiRequest<CreateGameResponse>('/api/v2/game', {
    method: 'POST',
    body: data,
    token,
  });
}

/**
 * Generate next scene for dialogue type progression
 * 
 * Used when current scene type is 'dialogue' and user clicks to proceed.
 * Sends emotion data and elapsed time to get the next scene(s).
 * 
 * @param gameId - Game identifier (number)
 * @param sessionId - Session identifier (number)
 * @param sceneId - Current scene identifier (number)
 * @param data - Request data containing emotion and time
 * @param token - Authentication token
 * @returns Promise with updated session data including new scenes
 * @throws ApiError if scene generation fails
 */
export async function generateNextScene(
  gameId: number,
  sessionId: number,
  sceneId: number,
  data: NextSceneRequest,
  token: string
): Promise<NextSceneResponse> {
  return apiRequest<NextSceneResponse>(
    `/api/v2/game/${gameId}/${sessionId}/${sceneId}`,
    {
      method: 'POST',
      body: data,
      token,
    }
  );
}

/**
 * Generate next scene after user makes a selection
 * 
 * Used when current scene type is 'selections' and user chooses an option.
 * Sends the selected choice ID along with emotion data and elapsed time.
 * 
 * @param gameId - Game identifier (number)
 * @param sessionId - Session identifier (number)
 * @param sceneId - Current scene identifier (number)
 * @param selectionId - Selected choice identifier (number)
 * @param data - Request data containing emotion and time
 * @param token - Authentication token
 * @returns Promise with updated session data including new scenes
 * @throws ApiError if scene generation fails
 */
export async function generateSceneAfterSelection(
  gameId: number,
  sessionId: number,
  sceneId: number,
  selectionId: number,
  data: NextSceneRequest,
  token: string
): Promise<NextSceneResponse> {
  return apiRequest<NextSceneResponse>(
    `/api/v2/game/${gameId}/${sessionId}/${sceneId}/selection/${selectionId}`,
    {
      method: 'POST',
      body: data,
      token,
    }
  );
}
