"use client";

import { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import type { Medication } from "@/types";
import { cn } from "@/lib/utils";

interface MedicationsPanelProps {
  medications: Medication[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  className?: string;
}

export function MedicationsPanel({ medications, isLoading, isError, onRetry, className }: MedicationsPanelProps) {
  const [showPast, setShowPast] = useState(false);
  const current = (medications ?? []).filter((m) => m.status === "current");
  const past = (medications ?? []).filter((m) => m.status === "past");

  return (
    <Card className={className}>
      <CardHeader
        title="Current medications"
        actions={<Badge tone="accent">{current.length}</Badge>}
      />
      {isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-4">
          <ErrorState message="Could not load medications." onRetry={onRetry} />
        </div>
      ) : current.length === 0 && !showPast ? (
        <p className="px-4 py-6 text-center text-[13px] text-muted">No current medications.</p>
      ) : (
        <ul className="divide-y divide-line">
          {(showPast ? [...current, ...past] : current).map((medication) => (
            <li key={medication.id} className="px-4 py-2.5">
              <p className="text-sm text-ink">
                {medication.name} <span className="font-normal text-secondary">{medication.dose}</span>
                {medication.status === "past" ? (
                  <span className="ml-1.5 text-xs text-muted">(ended {formatDate(medication.end_date ?? medication.start_date)})</span>
                ) : null}
              </p>
              <p className="text-xs text-muted">{medication.frequency}</p>
              <p className="text-xs text-muted">
                Prescribed by {medication.prescribed_by} · from {formatDate(medication.start_date)}
              </p>
            </li>
          ))}
        </ul>
      )}
      {past.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowPast((value) => !value)}
          aria-expanded={showPast}
          className={cn(
            "flex w-full items-center gap-1.5 border-t border-line px-4 py-2.5 text-[13px] font-medium text-accent transition-colors duration-150 hover:bg-app focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          )}
        >
          {showPast ? <LuChevronUp aria-hidden className="size-3.5" /> : <LuChevronDown aria-hidden className="size-3.5" />}
          {showPast ? "Hide past medications" : `Show past medications (${past.length})`}
        </button>
      ) : null}
    </Card>
  );
}
