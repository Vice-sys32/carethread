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
          "h-9 w-full appearance-none rounded-input border border-line-strong bg-surface px-3 pr-8 text-base text-ink transition-all duration-150 hover:border-leaf/60 focus-visible:outline-none focus-visible:border-leaf focus-visible:ring-2 focus-visible:ring-leaf/25 disabled:cursor-not-allowed disabled:bg-app disabled:text-muted sm:text-sm",
          invalid && "border-danger hover:border-danger focus-visible:border-danger focus-visible:ring-danger/20",
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
