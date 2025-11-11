import { describe, it, expect } from 'vitest';
import {
  clampEmotionValue,
  getDefaultEmotionData,
  normalizeEmotionData,
  type RawEmotionData,
} from './emotionUtils';

describe('emotionUtils', () => {
  describe('clampEmotionValue', () => {
    it('should return value within 0-100 range unchanged', () => {
      expect(clampEmotionValue(0)).toBe(0);
      expect(clampEmotionValue(50)).toBe(50);
      expect(clampEmotionValue(100)).toBe(100);
    });

    it('should clamp negative values to 0', () => {
      expect(clampEmotionValue(-1)).toBe(0);
      expect(clampEmotionValue(-50)).toBe(0);
      expect(clampEmotionValue(-100)).toBe(0);
    });

    it('should clamp values above 100 to 100', () => {
      expect(clampEmotionValue(101)).toBe(100);
      expect(clampEmotionValue(150)).toBe(100);
      expect(clampEmotionValue(1000)).toBe(100);
    });

    it('should round decimal values', () => {
      expect(clampEmotionValue(50.4)).toBe(50);
      expect(clampEmotionValue(50.5)).toBe(51);
      expect(clampEmotionValue(50.9)).toBe(51);
    });

    it('should handle edge cases with very large numbers', () => {
      expect(clampEmotionValue(Number.MAX_SAFE_INTEGER)).toBe(100);
      expect(clampEmotionValue(Number.MIN_SAFE_INTEGER)).toBe(0);
    });

    it('should handle decimal edge cases', () => {
      expect(clampEmotionValue(0.1)).toBe(0);
      expect(clampEmotionValue(0.5)).toBe(1);
      expect(clampEmotionValue(99.5)).toBe(100);
      expect(clampEmotionValue(99.4)).toBe(99);
    });
  });

  describe('getDefaultEmotionData', () => {
    it('should return emotion data with neutral set to 100', () => {
      const result = getDefaultEmotionData();
      expect(result.neutral).toBe(100);
    });

    it('should return emotion data with all other emotions set to 0', () => {
      const result = getDefaultEmotionData();
      expect(result.angry).toBe(0);
      expect(result.disgust).toBe(0);
      expect(result.fear).toBe(0);
      expect(result.happy).toBe(0);
      expect(result.sad).toBe(0);
      expect(result.surprise).toBe(0);
    });

    it('should return a complete EmotionData object', () => {
      const result = getDefaultEmotionData();
      expect(result).toEqual({
        angry: 0,
        disgust: 0,
        fear: 0,
        happy: 0,
        sad: 0,
        surprise: 0,
        neutral: 100,
      });
    });

    it('should return a new object each time', () => {
      const result1 = getDefaultEmotionData();
      const result2 = getDefaultEmotionData();
      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe('normalizeEmotionData', () => {
    describe('null and undefined handling', () => {
      it('should return default emotion data when input is null', () => {
        const result = normalizeEmotionData(null);
        expect(result).toEqual(getDefaultEmotionData());
      });

      it('should return default emotion data when input is undefined', () => {
        const result = normalizeEmotionData(undefined);
        expect(result).toEqual(getDefaultEmotionData());
      });

      it('should return default emotion data when input is not an object', () => {
        expect(normalizeEmotionData(123 as never)).toEqual(getDefaultEmotionData());
        expect(normalizeEmotionData('string' as never)).toEqual(getDefaultEmotionData());
        expect(normalizeEmotionData(true as never)).toEqual(getDefaultEmotionData());
      });
    });

    describe('standard emotion key mapping', () => {
      it('should map standard lowercase emotion keys', () => {
        const raw: RawEmotionData = {
          angry: 10,
          disgust: 20,
          fear: 30,
          happy: 40,
          sad: 50,
          surprise: 60,
          neutral: 70,
        };
        const result = normalizeEmotionData(raw);
        expect(result).toEqual({
          angry: 10,
          disgust: 20,
          fear: 30,
          happy: 40,
          sad: 50,
          surprise: 60,
          neutral: 70,
        });
      });

      it('should map capitalized emotion keys', () => {
        const raw: RawEmotionData = {
          Angry: 15,
          Disgust: 25,
          Fear: 35,
          Happy: 45,
          Sad: 55,
          Surprise: 65,
          Neutral: 75,
        };
        const result = normalizeEmotionData(raw);
        expect(result).toEqual({
          angry: 15,
          disgust: 25,
          fear: 35,
          happy: 45,
          sad: 55,
          surprise: 65,
          neutral: 75,
        });
      });
    });

    describe('alternative emotion key mapping', () => {
      it('should map "anger" to angry', () => {
        const raw: RawEmotionData = { anger: 25 };
        const result = normalizeEmotionData(raw);
        expect(result.angry).toBe(25);
      });

      it('should map "Anger" to angry', () => {
        const raw: RawEmotionData = { Anger: 30 };
        const result = normalizeEmotionData(raw);
        expect(result.angry).toBe(30);
      });

      it('should map "happiness" to happy', () => {
        const raw: RawEmotionData = { happiness: 80 };
        const result = normalizeEmotionData(raw);
        expect(result.happy).toBe(80);
      });

      it('should map "Happiness" to happy', () => {
        const raw: RawEmotionData = { Happiness: 85 };
        const result = normalizeEmotionData(raw);
        expect(result.happy).toBe(85);
      });

      it('should map "sadness" to sad', () => {
        const raw: RawEmotionData = { sadness: 60 };
        const result = normalizeEmotionData(raw);
        expect(result.sad).toBe(60);
      });

      it('should map "Sadness" to sad', () => {
        const raw: RawEmotionData = { Sadness: 65 };
        const result = normalizeEmotionData(raw);
        expect(result.sad).toBe(65);
      });

      it('should map "surprised" to surprise', () => {
        const raw: RawEmotionData = { surprised: 70 };
        const result = normalizeEmotionData(raw);
        expect(result.surprise).toBe(70);
      });

      it('should map "Surprised" to surprise', () => {
        const raw: RawEmotionData = { Surprised: 75 };
        const result = normalizeEmotionData(raw);
        expect(result.surprise).toBe(75);
      });
    });

    describe('value clamping', () => {
      it('should clamp negative values to 0', () => {
        const raw: RawEmotionData = {
          angry: -10,
          disgust: -20,
          fear: -30,
        };
        const result = normalizeEmotionData(raw);
        expect(result.angry).toBe(0);
        expect(result.disgust).toBe(0);
        expect(result.fear).toBe(0);
      });

      it('should clamp values above 100 to 100', () => {
        const raw: RawEmotionData = {
          happy: 150,
          sad: 200,
          surprise: 1000,
        };
        const result = normalizeEmotionData(raw);
        expect(result.happy).toBe(100);
        expect(result.sad).toBe(100);
        expect(result.surprise).toBe(100);
      });

      it('should round decimal values', () => {
        const raw: RawEmotionData = {
          angry: 10.4,
          happy: 50.5,
          sad: 75.9,
        };
        const result = normalizeEmotionData(raw);
        expect(result.angry).toBe(10);
        expect(result.happy).toBe(51);
        expect(result.sad).toBe(76);
      });
    });

    describe('missing emotion handling', () => {
      it('should default missing emotions to 0', () => {
        const raw: RawEmotionData = {
          happy: 80,
        };
        const result = normalizeEmotionData(raw);
        expect(result.happy).toBe(80);
        expect(result.angry).toBe(0);
        expect(result.disgust).toBe(0);
        expect(result.fear).toBe(0);
        expect(result.sad).toBe(0);
        expect(result.surprise).toBe(0);
        expect(result.neutral).toBe(0);
      });

      it('should handle empty object', () => {
        const raw: RawEmotionData = {};
        const result = normalizeEmotionData(raw);
        expect(result).toEqual({
          angry: 0,
          disgust: 0,
          fear: 0,
          happy: 0,
          sad: 0,
          surprise: 0,
          neutral: 0,
        });
      });
    });

    describe('key priority', () => {
      it('should prioritize lowercase "angry" over "anger"', () => {
        const raw: RawEmotionData = {
          angry: 10,
          anger: 20,
        };
        const result = normalizeEmotionData(raw);
        expect(result.angry).toBe(10);
      });

      it('should prioritize "anger" over capitalized variants', () => {
        const raw: RawEmotionData = {
          anger: 15,
          Angry: 25,
          Anger: 35,
        };
        const result = normalizeEmotionData(raw);
        expect(result.angry).toBe(15);
      });

      it('should prioritize lowercase "happy" over "happiness"', () => {
        const raw: RawEmotionData = {
          happy: 60,
          happiness: 70,
        };
        const result = normalizeEmotionData(raw);
        expect(result.happy).toBe(60);
      });
    });

    describe('mixed input scenarios', () => {
      it('should handle mixed case and alternative keys', () => {
        const raw: RawEmotionData = {
          Anger: 20,
          happiness: 80,
          Fear: 30,
          surprised: 40,
          sadness: 50,
          disgust: 10,
          Neutral: 5,
        };
        const result = normalizeEmotionData(raw);
        expect(result).toEqual({
          angry: 20,
          disgust: 10,
          fear: 30,
          happy: 80,
          sad: 50,
          surprise: 40,
          neutral: 5,
        });
      });

      it('should handle values that need clamping and rounding', () => {
        const raw: RawEmotionData = {
          angry: -5.7,
          happy: 150.3,
          sad: 45.5,
          neutral: 99.9,
        };
        const result = normalizeEmotionData(raw);
        expect(result.angry).toBe(0);
        expect(result.happy).toBe(100);
        expect(result.sad).toBe(46);
        expect(result.neutral).toBe(100);
      });

      it('should handle non-numeric values gracefully', () => {
        const raw: RawEmotionData = {
          angry: 'not a number' as never,
          happy: 50,
          sad: null as never,
          fear: undefined as never,
        };
        const result = normalizeEmotionData(raw);
        expect(result.angry).toBe(0);
        expect(result.happy).toBe(50);
        expect(result.sad).toBe(0);
        expect(result.fear).toBe(0);
      });
    });

    describe('real-world scenarios', () => {
      it('should handle face-api.js style output', () => {
        const raw: RawEmotionData = {
          neutral: 0.85,
          happy: 0.10,
          sad: 0.03,
          angry: 0.01,
          fearful: 0.01, // Note: this won't map, testing robustness
        };
        const result = normalizeEmotionData(raw);
        expect(result.neutral).toBe(1);
        expect(result.happy).toBe(0);
        expect(result.sad).toBe(0);
        expect(result.angry).toBe(0);
      });

      it('should handle percentage-based input (0-100)', () => {
        const raw: RawEmotionData = {
          angry: 5,
          disgust: 2,
          fear: 3,
          happy: 75,
          sad: 10,
          surprise: 5,
          neutral: 0,
        };
        const result = normalizeEmotionData(raw);
        expect(result).toEqual({
          angry: 5,
          disgust: 2,
          fear: 3,
          happy: 75,
          sad: 10,
          surprise: 5,
          neutral: 0,
        });
      });

      it('should handle normalized input (0-1) scaled to percentage', () => {
        const raw: RawEmotionData = {
          happy: 0.95 * 100,
          neutral: 0.05 * 100,
        };
        const result = normalizeEmotionData(raw);
        expect(result.happy).toBe(95);
        expect(result.neutral).toBe(5);
      });
    });
  });
});
