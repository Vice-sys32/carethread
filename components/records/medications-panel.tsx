"use client";

import { useState } from "react";
import { LuChevronDown, LuChevronUp, LuPill } from "react-icons/lu";
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

export function MedicationsPanel({
  medications,
  isLoading,
  isError,
  onRetry,
  className,
}: MedicationsPanelProps) {
  const [showPast, setShowPast] = useState(false);
  const current = (medications ?? []).filter((m) => m.status === "current");
  const past = (medications ?? []).filter((m) => m.status === "past");

  return (
    <Card className={cn("overflow-hidden border-line shadow-card", className)}>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <LuPill aria-hidden className="size-4 text-leaf" />
            <span>Medications</span>
          </div>
        }
        description="Prescribed active regimens"
        actions={<Badge tone="leaf" dot>{current.length} Active</Badge>}
      />

      {isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-input" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-4">
          <ErrorState message="Could not load medications." onRetry={onRetry} />
        </div>
      ) : current.length === 0 && !showPast ? (
        <div className="px-4 py-8 text-center text-xs text-muted flex flex-col items-center gap-1.5">
          <LuPill className="size-6 text-muted/60" />
          <p>No active medications on record.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line/70">
          {(showPast ? [...current, ...past] : current).map((medication) => (
            <li key={medication.id} className="p-4 transition-colors hover:bg-mint/15">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  {medication.name}{" "}
                  <span className="font-normal text-forest text-xs">{medication.dose}</span>
                </p>
                {medication.status === "past" ? (
                  <Badge tone="neutral" className="text-[10px]">Past</Badge>
                ) : (
                  <Badge tone="leaf" className="text-[10px]">Active</Badge>
                )}
              </div>
              <p className="mt-1 text-xs font-medium text-secondary">{medication.frequency}</p>
              <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                Prescribed by {medication.prescribed_by} · from {formatDate(medication.start_date)}
                {medication.status === "past" && medication.end_date
                  ? ` to ${formatDate(medication.end_date)}`
                  : ""}
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
          className="flex w-full items-center justify-center gap-2 border-t border-line bg-app/40 px-4 py-3 text-xs font-semibold text-forest transition-colors duration-150 hover:bg-mint/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/25"
        >
          {showPast ? <LuChevronUp aria-hidden className="size-4" /> : <LuChevronDown aria-hidden className="size-4" />}
          {showPast ? "Hide past medications" : `View past medications (${past.length})`}
        </button>
      ) : null}
    </Card>
  );
}
