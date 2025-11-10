/**
 * GameTimeTracker
 * 
 * Tracks elapsed game time in seconds, excluding paused time.
 * Used to send accurate playtime data to the v2 API.
 */
export class GameTimeTracker {
  private startTime: number | null = null;
  private pausedTime: number = 0;
  private lastPauseStart: number | null = null;

  /**
   * Start tracking time from now
   */
  start(): void {
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.lastPauseStart = null;
  }

  /**
   * Pause the time tracking
   */
  pause(): void {
    if (this.startTime === null) {
      return; // Not started yet
    }

    if (this.lastPauseStart !== null) {
      return; // Already paused
    }

    this.lastPauseStart = Date.now();
  }

  /**
   * Resume time tracking after pause
   */
  resume(): void {
    if (this.lastPauseStart === null) {
      return; // Not paused
    }

    const pauseDuration = Date.now() - this.lastPauseStart;
    this.pausedTime += pauseDuration;
    this.lastPauseStart = null;
  }

  /**
   * Get elapsed time in seconds, excluding paused time
   * @returns Elapsed seconds as an integer
   */
  getElapsedSeconds(): number {
    if (this.startTime === null) {
      return 0;
    }

    const now = Date.now();
    const totalElapsed = now - this.startTime;
    
    // If currently paused, add the current pause duration
    let currentPauseDuration = 0;
    if (this.lastPauseStart !== null) {
      currentPauseDuration = now - this.lastPauseStart;
    }

    const activeTime = totalElapsed - this.pausedTime - currentPauseDuration;
    return Math.floor(activeTime / 1000);
  }

  /**
   * Reset the tracker to initial state
   */
  reset(): void {
    this.startTime = null;
    this.pausedTime = 0;
    this.lastPauseStart = null;
  }
}
