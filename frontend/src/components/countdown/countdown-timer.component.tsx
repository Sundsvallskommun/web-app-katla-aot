import { useEffect, useRef, useState } from 'react';

interface CountdownTimerProps {
  timeout: number; // timeout in milliseconds
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ timeout }) => {
  const [timeLeft, setTimeLeft] = useState<number>(timeout);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const tick = () => {
      setTimeLeft((prevTime) => prevTime - 1000);
    };

    timerIdRef.current = setInterval(tick, 1000);

    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 && timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }
  }, [timeLeft]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.max(Math.floor(milliseconds / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return <span>{formatTime(timeLeft)}</span>;
};

export default CountdownTimer;
