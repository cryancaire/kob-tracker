import { useState, useEffect } from "react";

interface LiveTimerProps {
  startTime: string;
  endTime?: string | null;
  timerStartedAt?: string | null;
  timerPausedAt?: string | null;
  timerTotalPausedTime?: number;
  className?: string;
}

export function LiveTimer({ 
  startTime, 
  endTime, 
  timerStartedAt,
  timerPausedAt,
  timerTotalPausedTime = 0,
  className = "" 
}: LiveTimerProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      // If timer hasn't been started yet and game is still active, show 0:00
      if (!endTime && !timerStartedAt) {
        setElapsedTime("0:00");
        return;
      }

      // Use timer_started_at if available, otherwise fall back to created_at
      const actualStartTime = timerStartedAt || startTime;
      const start = new Date(actualStartTime);
      
      let totalElapsed: number;
      
      if (endTime) {
        // Game ended - calculate total time
        const end = new Date(endTime);
        totalElapsed = end.getTime() - start.getTime() - timerTotalPausedTime;
      } else if (timerPausedAt) {
        // Timer is currently paused
        const pausedAt = new Date(timerPausedAt);
        totalElapsed = pausedAt.getTime() - start.getTime() - timerTotalPausedTime;
      } else {
        // Timer is running
        const now = new Date();
        totalElapsed = now.getTime() - start.getTime() - timerTotalPausedTime;
      }

      // Ensure elapsed time is not negative
      totalElapsed = Math.max(0, totalElapsed);

      const hours = Math.floor(totalElapsed / (1000 * 60 * 60));
      const minutes = Math.floor((totalElapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((totalElapsed % (1000 * 60)) / 1000);

      if (hours > 0) {
        setElapsedTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();

    // Only update the timer if the game is not ended, not paused, and timer has been started
    if (!endTime && !timerPausedAt && timerStartedAt) {
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime, timerStartedAt, timerPausedAt, timerTotalPausedTime]);

  const isActive = !endTime && !timerPausedAt && timerStartedAt;
  const isPaused = !endTime && timerPausedAt;
  const isStopped = !endTime && !timerStartedAt;
  
  return (
    <span className={`live-timer ${isActive ? 'active' : isPaused ? 'paused' : isStopped ? 'stopped' : 'ended'} ${className}`}>
      {elapsedTime}
    </span>
  );
}