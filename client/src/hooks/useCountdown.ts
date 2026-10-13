import { useEffect, useState } from 'react';

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function compute(target: number): Countdown {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff === 0,
  };
}

export function useCountdown(targetIso: string): Countdown {
  const target = new Date(targetIso).getTime();
  const [value, setValue] = useState(() => compute(target));

  useEffect(() => {
    setValue(compute(target));
    const id = window.setInterval(() => setValue(compute(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return value;
}
