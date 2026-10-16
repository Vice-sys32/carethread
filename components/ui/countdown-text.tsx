"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CountdownTextProps {
  expiresAt?: string | null;
  onExpire?: () => void;
  className?: string;
}

export function CountdownText({ expiresAt, onExpire, className }: CountdownTextProps) {
  const secondsLeft = useCountdown(expiresAt, onExpire);
  if (secondsLeft === null) {
    return <span className={cn("font-mono tabular-nums text-muted", className)}>--:--</span>;
  }
  if (secondsLeft <= 0) {
    return <span className={cn("font-mono tabular-nums text-danger", className)}>Expired</span>;
  }
  return <span className={cn("font-mono tabular-nums text-ink", className)}>{formatDuration(secondsLeft)}</span>;
}
