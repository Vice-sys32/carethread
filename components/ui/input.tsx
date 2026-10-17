import { cn } from "@/lib/utils";

const baseClasses =
  "h-9 w-full rounded-input border border-line-strong bg-surface px-3 text-base text-ink transition-all duration-150 placeholder:text-muted hover:border-leaf/60 focus-visible:outline-none focus-visible:border-leaf focus-visible:ring-2 focus-visible:ring-leaf/25 disabled:cursor-not-allowed disabled:bg-app disabled:text-muted read-only:bg-app read-only:hover:border-line-strong sm:text-sm";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        baseClasses,
        invalid && "border-danger hover:border-danger focus-visible:border-danger focus-visible:ring-danger/20",
        className,
      )}
      {...props}
    />
  );
}
