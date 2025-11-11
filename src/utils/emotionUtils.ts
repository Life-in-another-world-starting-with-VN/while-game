/**
 * Emotion Data Utilities
 * 
 * Utilities for converting and normalizing emotion data to v2 API format.
 * Handles raw emotion data from various sources and ensures all values
 * are within the valid 0-100 range.
 */

import type { EmotionData } from '../types/api-v2';

/**
 * Raw emotion data structure from emotion detection systems
 * Keys may vary depending on the source
 */
export interface RawEmotionData {
  [key: string]: number;
}

/**
 * Clamps an emotion value to the valid 0-100 range
 * 
 * @param value - The emotion value to clamp
 * @returns The clamped value between 0 and 100
 */
export function clampEmotionValue(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Returns default emotion data with neutral emotion set to 100
 * and all other emotions set to 0
 * 
 * @returns Default EmotionData object
 */
export function getDefaultEmotionData(): EmotionData {
  return {
    angry: 0,
    disgust: 0,
    fear: 0,
    happy: 0,
    sad: 0,
    surprise: 0,
    neutral: 100,
  };
}

/**
 * Normalizes raw emotion data to v2 API EmotionData format
 * 
 * - Handles null or undefined input by returning default values
 * - Maps common emotion key variations to standard v2 format
 * - Clamps all values to 0-100 range
 * - Provides default values for missing emotions
 * 
 * @param raw - Raw emotion data from detection system (can be null)
 * @returns Normalized EmotionData object
 */
export function normalizeEmotionData(raw: RawEmotionData | null | undefined): EmotionData {
  // Return default if no data provided
  if (!raw || typeof raw !== 'object') {
    return getDefaultEmotionData();
  }

  // Helper function to extract and clamp emotion value
  const getEmotionValue = (keys: string[]): number => {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === 'number') {
        return clampEmotionValue(value);
      }
    }
    return 0;
  };

  return {
    angry: getEmotionValue(['angry', 'anger', 'Angry', 'Anger']),
    disgust: getEmotionValue(['disgust', 'Disgust']),
    fear: getEmotionValue(['fear', 'Fear']),
    happy: getEmotionValue(['happy', 'happiness', 'Happy', 'Happiness']),
    sad: getEmotionValue(['sad', 'sadness', 'Sad', 'Sadness']),
    surprise: getEmotionValue(['surprise', 'surprised', 'Surprise', 'Surprised']),
    neutral: getEmotionValue(['neutral', 'Neutral']),
  };
}
