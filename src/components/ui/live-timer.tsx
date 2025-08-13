import { useState, useEffect } from "react";

interface LiveTimerProps {
  startTime: string;
  endTime?: string | null;
  className?: string;
}

export function LiveTimer({ startTime, endTime, className = "" }: LiveTimerProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime);
      const end = endTime ? new Date(endTime) : new Date();
      const diff = end.getTime() - start.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setElapsedTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();

    if (!endTime) {
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime]);

  return (
    <span className={`live-timer ${!endTime ? 'active' : 'ended'} ${className}`}>
      {elapsedTime}
    </span>
  );
}