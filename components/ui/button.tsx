"use client";

import { cn } from "@/lib/utils";
import { LeafSpinner } from "./botanical-icons";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-forest text-white shadow-subtle hover:bg-forest-dark hover:shadow-card active:scale-[0.98] focus-visible:outline-leaf",
  secondary:
    "border border-line-strong bg-surface text-ink shadow-subtle hover:border-leaf hover:bg-mint/30 hover:text-forest-dark active:scale-[0.98] focus-visible:outline-leaf",
  ghost:
    "text-secondary hover:bg-mint/40 hover:text-forest-dark active:scale-[0.98] focus-visible:outline-leaf",
  danger:
    "bg-danger text-white shadow-subtle hover:bg-danger/90 active:scale-[0.98] focus-visible:outline-danger",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-[13px] rounded-input",
  md: "h-9 gap-2 px-4 text-sm rounded-input",
  lg: "h-10 gap-2.5 px-5 text-sm rounded-input font-semibold",
};

const baseClasses =
  "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  type = "button",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {loading ? (
        <span className="mr-1.5 inline-flex">
          <LeafSpinner size={size === "sm" ? 14 : 16} className={variant === "primary" ? "text-white" : "text-forest"} />
        </span>
      ) : null}
      {children}
    </button>
  );
}
