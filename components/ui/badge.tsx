import { cn } from "@/lib/utils";

export type BadgeTone =
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "slate"
  | "gray"
  | "neutral"
  | "leaf"
  | "mint";

const toneClasses: Record<BadgeTone, string> = {
  accent: "bg-mint text-forest font-semibold border border-forest/20",
  leaf: "bg-mint text-leaf font-semibold border border-leaf/30",
  mint: "bg-mint text-forest-dark font-medium border border-line",
  success: "bg-mint text-forest font-semibold border border-leaf/30",
  warning: "bg-warning-tint text-warning font-semibold border border-warning/25",
  danger: "bg-danger-tint text-danger font-semibold border border-danger/25",
  info: "bg-mint text-forest font-semibold border border-leaf/25",
  slate: "bg-slate-tint text-slate-ink font-medium border border-line",
  gray: "bg-gray-tint text-secondary font-medium border border-line",
  neutral: "border border-line bg-app text-secondary font-medium",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ tone = "neutral", children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-badge px-2 py-0.5 text-xs leading-4 transition-colors",
        toneClasses[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className={cn(
            "size-1.5 rounded-full shrink-0",
            tone === "danger"
              ? "bg-danger"
              : tone === "warning"
                ? "bg-warning"
                : tone === "accent" || tone === "success" || tone === "leaf"
                  ? "bg-leaf"
                  : "bg-muted",
          )}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
