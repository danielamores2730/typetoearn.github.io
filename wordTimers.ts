import { useEffect, useRef, useState } from 'react';

export function useWordCountdown(wordDurationMs: number) {
  const [remainingMs, setRemainingMs] = useState(wordDurationMs);
  const [running, setRunning] = useState(true);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    setRemainingMs(wordDurationMs);

    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.max(0, wordDurationMs - elapsed);
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(id);
        setRunning(false);
      }
    }, 50);

    return () => clearInterval(id);
  }, [wordDurationMs, running]);

  function restart(nextWordDurationMs: number) {
    setRunning(true);
    // This will trigger effect via new wordDurationMs from parent.
    // Parent should update prop.
  }

  return { remainingMs, running, restart };
}

