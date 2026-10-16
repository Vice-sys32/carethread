import { cn } from "@/lib/utils";

export type BadgeTone = "accent" | "success" | "warning" | "danger" | "info" | "slate" | "gray" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  accent: "bg-accent-tint text-accent",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
  info: "bg-info-tint text-info",
  slate: "bg-slate-tint text-slate-ink",
  gray: "bg-gray-tint text-secondary",
  neutral: "border border-line bg-app text-secondary",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium leading-4", toneClasses[tone], className)}>
      {children}
    </span>
  );
}
