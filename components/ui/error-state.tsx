"use client";

import { LuRefreshCw, LuTriangleAlert } from "react-icons/lu";
import { Button } from "./button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-card border border-danger/30 bg-danger-tint/50 px-6 py-10 text-center"
    >
      <LuTriangleAlert aria-hidden className="size-5 text-danger" />
      <p className="text-sm font-medium text-ink">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <LuRefreshCw aria-hidden className="size-3.5" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
