"use client";

import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  ariaLabel: string;
  className?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "grid auto-cols-fr grid-flow-col rounded-input border border-line bg-app p-1 gap-1 select-none",
        className,
      )}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[6px] px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/25",
              active
                ? "border border-line-strong bg-surface text-forest font-semibold shadow-subtle"
                : "border border-transparent text-secondary hover:text-ink hover:bg-mint/40",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
