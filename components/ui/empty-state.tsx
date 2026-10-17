"use client";

import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";
import { EmptyPlantIllustration, SproutIcon } from "./botanical-icons";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: IconType;
  showPlant?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  showPlant = true,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong bg-surface/80 p-8 text-center backdrop-blur-xs",
        className,
      )}
    >
      {showPlant && !Icon ? (
        <EmptyPlantIllustration className="mb-1" />
      ) : Icon ? (
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-mint text-forest shadow-subtle">
          <Icon aria-hidden className="size-5" />
        </div>
      ) : (
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-mint text-forest shadow-subtle">
          <SproutIcon size={22} />
        </div>
      )}
      <p className="text-sm font-semibold tracking-tight text-ink">{title}</p>
      {description ? <p className="max-w-sm text-[13px] leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
