import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  warning?: string;
  children: React.ReactNode;
  className?: string;
  labelSuffix?: React.ReactNode;
}

export function Field({ id, label, required, hint, error, warning, children, className, labelSuffix }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
        <span>{label}</span>
        <span className="font-normal text-muted text-[11px]">{required ? "(required)" : "(optional)"}</span>
        {labelSuffix}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : warning ? (
        <p id={`${id}-warning`} className="text-xs font-medium text-warning">
          {warning}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted leading-relaxed">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
