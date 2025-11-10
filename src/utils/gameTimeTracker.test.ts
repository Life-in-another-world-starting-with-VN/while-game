import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameTimeTracker } from './gameTimeTracker';

describe('GameTimeTracker', () => {
  let tracker: GameTimeTracker;

  beforeEach(() => {
    tracker = new GameTimeTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('시간 추적 정확도', () => {
    it('should return 0 seconds when not started', () => {
      expect(tracker.getElapsedSeconds()).toBe(0);
    });

    it('should track elapsed time accurately in seconds', () => {
      tracker.start();
      
      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);
      expect(tracker.getElapsedSeconds()).toBe(5);
      
      // Advance time by another 3 seconds
      vi.advanceTimersByTime(3000);
      expect(tracker.getElapsedSeconds()).toBe(8);
    });

    it('should floor fractional seconds to integer', () => {
      tracker.start();
      
      // Advance time by 2.7 seconds
      vi.advanceTimersByTime(2700);
      expect(tracker.getElapsedSeconds()).toBe(2);
      
      // Advance time by another 0.5 seconds (total 3.2)
      vi.advanceTimersByTime(500);
      expect(tracker.getElapsedSeconds()).toBe(3);
    });

    it('should track time accurately over longer periods', () => {
      tracker.start();
      
      // Advance time by 1 minute
      vi.advanceTimersByTime(60000);
      expect(tracker.getElapsedSeconds()).toBe(60);
      
      // Advance time by 5 minutes
      vi.advanceTimersByTime(300000);
      expect(tracker.getElapsedSeconds()).toBe(360);
    });
  });

  describe('일시정지/재개 기능', () => {
    it('should pause time tracking', () => {
      tracker.start();
      
      // Run for 3 seconds
      vi.advanceTimersByTime(3000);
      expect(tracker.getElapsedSeconds()).toBe(3);
      
      // Pause
      tracker.pause();
      
      // Advance time by 5 seconds while paused
      vi.advanceTimersByTime(5000);
      
      // Time should still be 3 seconds (paused time excluded)
      expect(tracker.getElapsedSeconds()).toBe(3);
    });

    it('should resume time tracking after pause', () => {
      tracker.start();
      
      // Run for 2 seconds
      vi.advanceTimersByTime(2000);
      expect(tracker.getElapsedSeconds()).toBe(2);
      
      // Pause
      tracker.pause();
      
      // Advance time by 10 seconds while paused
      vi.advanceTimersByTime(10000);
      
      // Resume
      tracker.resume();
      
      // Advance time by 3 seconds after resume
      vi.advanceTimersByTime(3000);
      
      // Total active time should be 2 + 3 = 5 seconds
      expect(tracker.getElapsedSeconds()).toBe(5);
    });

    it('should handle multiple pause/resume cycles', () => {
      tracker.start();
      
      // Run for 2 seconds
      vi.advanceTimersByTime(2000);
      
      // First pause
      tracker.pause();
      vi.advanceTimersByTime(5000); // 5 seconds paused
      tracker.resume();
      
      // Run for 3 seconds
      vi.advanceTimersByTime(3000);
      
      // Second pause
      tracker.pause();
      vi.advanceTimersByTime(7000); // 7 seconds paused
      tracker.resume();
      
      // Run for 1 second
      vi.advanceTimersByTime(1000);
      
      // Total active time: 2 + 3 + 1 = 6 seconds
      expect(tracker.getElapsedSeconds()).toBe(6);
    });

    it('should not pause if not started', () => {
      tracker.pause();
      
      // Should not throw error and should return 0
      expect(tracker.getElapsedSeconds()).toBe(0);
    });

    it('should not pause twice in a row', () => {
      tracker.start();
      
      // Run for 2 seconds
      vi.advanceTimersByTime(2000);
      
      // First pause
      tracker.pause();
      vi.advanceTimersByTime(3000);
      
      // Second pause (should be ignored)
      tracker.pause();
      vi.advanceTimersByTime(2000);
      
      // Resume
      tracker.resume();
      
      // Total paused time should be 3 + 2 = 5 seconds
      // Active time should be 2 seconds
      expect(tracker.getElapsedSeconds()).toBe(2);
    });

    it('should not resume if not paused', () => {
      tracker.start();
      
      // Run for 2 seconds
      vi.advanceTimersByTime(2000);
      
      // Resume without pausing (should be ignored)
      tracker.resume();
      
      // Run for 3 more seconds
      vi.advanceTimersByTime(3000);
      
      // Total time should be 2 + 3 = 5 seconds
      expect(tracker.getElapsedSeconds()).toBe(5);
    });
  });

  describe('일시정지 시간을 제외한 경과 시간 계산', () => {
    it('should exclude paused time from elapsed time', () => {
      tracker.start();
      
      // Active: 4 seconds
      vi.advanceTimersByTime(4000);
      
      // Pause for 10 seconds
      tracker.pause();
      vi.advanceTimersByTime(10000);
      tracker.resume();
      
      // Active: 3 more seconds
      vi.advanceTimersByTime(3000);
      
      // Total active time: 4 + 3 = 7 seconds (10 seconds paused excluded)
      expect(tracker.getElapsedSeconds()).toBe(7);
    });

    it('should calculate elapsed time correctly while paused', () => {
      tracker.start();
      
      // Active: 5 seconds
      vi.advanceTimersByTime(5000);
      
      // Pause
      tracker.pause();
      
      // Check time immediately after pause
      expect(tracker.getElapsedSeconds()).toBe(5);
      
      // Advance time while paused
      vi.advanceTimersByTime(20000);
      
      // Time should still be 5 seconds
      expect(tracker.getElapsedSeconds()).toBe(5);
    });

    it('should handle complex pause patterns', () => {
      tracker.start();
      
      // Active: 1 second
      vi.advanceTimersByTime(1000);
      
      // Pause 1: 2 seconds
      tracker.pause();
      vi.advanceTimersByTime(2000);
      tracker.resume();
      
      // Active: 2 seconds
      vi.advanceTimersByTime(2000);
      
      // Pause 2: 5 seconds
      tracker.pause();
      vi.advanceTimersByTime(5000);
      tracker.resume();
      
      // Active: 3 seconds
      vi.advanceTimersByTime(3000);
      
      // Pause 3: 1 second
      tracker.pause();
      vi.advanceTimersByTime(1000);
      tracker.resume();
      
      // Active: 4 seconds
      vi.advanceTimersByTime(4000);
      
      // Total active time: 1 + 2 + 3 + 4 = 10 seconds
      // Total paused time: 2 + 5 + 1 = 8 seconds (excluded)
      expect(tracker.getElapsedSeconds()).toBe(10);
    });

    it('should exclude current pause duration when calculating elapsed time', () => {
      tracker.start();
      
      // Active: 3 seconds
      vi.advanceTimersByTime(3000);
      
      // Pause and check time at different points
      tracker.pause();
      
      vi.advanceTimersByTime(1000);
      expect(tracker.getElapsedSeconds()).toBe(3);
      
      vi.advanceTimersByTime(2000);
      expect(tracker.getElapsedSeconds()).toBe(3);
      
      vi.advanceTimersByTime(5000);
      expect(tracker.getElapsedSeconds()).toBe(3);
    });
  });

  describe('reset 기능', () => {
    it('should reset tracker to initial state', () => {
      tracker.start();
      
      // Run for 10 seconds with pauses
      vi.advanceTimersByTime(5000);
      tracker.pause();
      vi.advanceTimersByTime(3000);
      tracker.resume();
      vi.advanceTimersByTime(2000);
      
      expect(tracker.getElapsedSeconds()).toBe(7);
      
      // Reset
      tracker.reset();
      
      // Should return 0 after reset
      expect(tracker.getElapsedSeconds()).toBe(0);
    });

    it('should allow starting again after reset', () => {
      tracker.start();
      vi.advanceTimersByTime(5000);
      
      tracker.reset();
      
      // Start again
      tracker.start();
      vi.advanceTimersByTime(3000);
      
      // Should track new time from reset
      expect(tracker.getElapsedSeconds()).toBe(3);
    });

    it('should clear pause state on reset', () => {
      tracker.start();
      vi.advanceTimersByTime(2000);
      
      tracker.pause();
      vi.advanceTimersByTime(5000);
      
      tracker.reset();
      
      // Start again and verify no residual pause state
      tracker.start();
      vi.advanceTimersByTime(4000);
      
      expect(tracker.getElapsedSeconds()).toBe(4);
    });
  });

  describe('엣지 케이스', () => {
    it('should handle start being called multiple times', () => {
      tracker.start();
      vi.advanceTimersByTime(3000);
      
      // Start again (should reset)
      tracker.start();
      vi.advanceTimersByTime(2000);
      
      // Should only count time from second start
      expect(tracker.getElapsedSeconds()).toBe(2);
    });

    it('should handle zero elapsed time', () => {
      tracker.start();
      
      // Check immediately
      expect(tracker.getElapsedSeconds()).toBe(0);
    });

    it('should handle very short time intervals', () => {
      tracker.start();
      
      // Advance by 100ms
      vi.advanceTimersByTime(100);
      expect(tracker.getElapsedSeconds()).toBe(0);
      
      // Advance by another 900ms (total 1000ms = 1s)
      vi.advanceTimersByTime(900);
      expect(tracker.getElapsedSeconds()).toBe(1);
    });
  });
});
