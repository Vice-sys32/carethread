import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(
          "h-9 w-full appearance-none rounded-input border border-line-strong bg-surface px-2.5 pr-8 text-base text-ink transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-app disabled:text-muted sm:text-sm",
          invalid && "border-danger focus-visible:outline-danger",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <LuChevronDown aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}
