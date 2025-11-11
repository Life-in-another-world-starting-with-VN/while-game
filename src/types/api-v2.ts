/**
 * v2 API Type Definitions
 * 
 * This file contains all TypeScript interfaces for the v2 API
 * including authentication, game creation, and scene progression.
 */

// ============================================================================
// Emotion Data Types
// ============================================================================

/**
 * Emotion data structure for v2 API
 * All values should be integers between 0-100
 */
export interface EmotionData {
  angry: number;
  disgust: number;
  fear: number;
  happy: number;
  sad: number;
  surprise: number;
  neutral: number;
}

// ============================================================================
// Scene Data Types
// ============================================================================

/**
 * Scene type discriminator
 */
export type SceneType = 'dialogue' | 'selection' | 'selections';

/**
 * Individual scene data structure
 */
export interface SceneData {
  role: string;
  scene_id: number;
  type: SceneType;
  dialogue?: string | null;
  selections?: Record<string, string>; // key: selection_id, value: selection_text
  character_filename?: string | null;
}

// ============================================================================
// Session Data Types
// ============================================================================

/**
 * Session data structure containing scenes and metadata
 */
export interface SessionData {
  session_id: number;
  content: string;
  scenes: SceneData[];
  background_url?: string | null;
}

// ============================================================================
// Game Creation Types
// ============================================================================

/**
 * Request payload for creating a new game
 */
export interface CreateGameRequest {
  personality: string;
  genre: string;
  playtime: number;
}

/**
 * Response from game creation endpoint
 * Includes initial session data
 */
export interface CreateGameResponse {
  game_id: number;
  personality: string;
  genre: string;
  title: string;
  playtime: number;
  sessions: SessionData[];
}

// ============================================================================
// Scene Progression Types
// ============================================================================

/**
 * Request payload for scene progression
 * Used for both dialogue and selection-based progression
 */
export interface NextSceneRequest {
  emotion: EmotionData;
  time: number; // elapsed time in seconds
}

/**
 * Response from scene progression endpoints
 * Contains updated session data with new scenes
 */
export interface NextSceneResponse {
  session_id: number;
  content: string;
  scenes: SceneData[];
  background_url?: string | null;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Request payload for user signup
 */
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * Response from signup endpoint
 */
export interface SignupResponse {
  message: string;
}

/**
 * Request payload for user login
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Response from login endpoint
 * Contains access and refresh tokens
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * Request payload for token reissue
 */
export interface ReissueRequest {
  refresh_token: string;
}

/**
 * Response from token reissue endpoint
 */
export interface ReissueResponse {
  access_token: string;
  refresh_token: string;
}
