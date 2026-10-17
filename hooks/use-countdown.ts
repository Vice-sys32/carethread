"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Seconds until `expiresAt`, or null until first measured on the client.
 * Calls `onExpire` once when the countdown reaches zero. The first value is
 * measured in a timeout so server and client render the same placeholder.
 */
export function useCountdown(
  expiresAt: string | null | undefined,
  onExpire?: () => void,
): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!expiresAt) {
      const clear = setTimeout(() => setSecondsLeft(null), 0);
      return () => clearTimeout(clear);
    }
    const tick = () => {
      const next = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(next);
      if (next <= 0) {
        clearInterval(interval);
        onExpireRef.current?.();
      }
    };
    const interval = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(interval);
      clearTimeout(first);
    };
  }, [expiresAt]);

  return secondsLeft;
}
