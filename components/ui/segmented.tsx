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

export function Segmented<T extends string>({ value, onChange, options, ariaLabel, className }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("grid auto-cols-fr grid-flow-col rounded-input border border-line bg-app p-0.5", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            value === option.value
              ? "border border-line-strong bg-surface text-ink"
              : "border border-transparent text-secondary hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
