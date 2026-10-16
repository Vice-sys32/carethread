import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  showCount?: boolean;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export function Textarea({ invalid, showCount, className, value, ...props }: TextareaProps) {
  const length = typeof value === "string" ? value.length : 0;
  return (
    <div className="flex flex-col gap-1">
      <textarea
        aria-invalid={invalid || undefined}
        value={value}
        className={cn(
          "min-h-20 w-full rounded-input border border-line-strong bg-surface px-2.5 py-2 text-base text-ink transition-colors duration-150 placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-app disabled:text-muted sm:text-sm",
          invalid && "border-danger focus-visible:outline-danger",
          className,
        )}
        {...props}
      />
      {showCount && props.maxLength ? (
        <span className="self-end font-mono text-xs tabular-nums text-muted">
          {length} / {props.maxLength}
        </span>
      ) : null}
    </div>
  );
}
