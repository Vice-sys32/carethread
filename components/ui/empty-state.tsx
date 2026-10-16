"use client";

import type { IconType } from "react-icons";
import { LuFolderOpen } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: IconType;
  className?: string;
}

export function EmptyState({ title, description, action, icon: Icon = LuFolderOpen, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center", className)}>
      <Icon aria-hidden className="mb-1 size-5 text-muted" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="max-w-sm text-[13px] text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
