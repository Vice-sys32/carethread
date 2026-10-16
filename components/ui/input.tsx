import { cn } from "@/lib/utils";

const baseClasses =
  "h-9 w-full rounded-input border border-line-strong bg-surface px-2.5 text-base text-ink transition-colors duration-150 placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-app disabled:text-muted read-only:bg-app sm:text-sm";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(baseClasses, invalid && "border-danger focus-visible:outline-danger", className)}
      {...props}
    />
  );
}
