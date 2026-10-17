import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function CareThreadLogo({
  className,
  size = 32,
  showText = false,
  textClassName,
}: {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Soft mint organic background badge */}
        <rect width="36" height="36" rx="10" fill="#E1F3E5" />
        
        {/* Botanical leaf-bulb: Bulb bulbous base inspired by Bulbasaur's nature theme */}
        <path
          d="M18 7.5C18 7.5 12 11.5 12 18.5C12 23.5 15.5 27 18 28.5C20.5 27 24 23.5 24 18.5C24 11.5 18 7.5 18 7.5Z"
          fill="#245C3A"
        />
        {/* Fresh leaf accent overlay */}
        <path
          d="M18 10C18 10 14 13.5 14 18.5C14 21.5 15.8 24.2 18 25.5C20.2 24.2 22 21.5 22 18.5C22 13.5 18 10 18 10Z"
          fill="#57A65C"
        />
        {/* Sprouting leaf highlight / leaf spine */}
        <path
          d="M18 12V24M18 16L15.5 14M18 19L20.5 17"
          stroke="#FFFDF5"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Organic continuity thread / ring arc wrapping around the leaf */}
        <path
          d="M9.5 18.5C9.5 23.2 13.3 27 18 27C21.8 27 25 24.5 26.1 21"
          stroke="#82C96B"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        {/* Small seedling bud dot */}
        <circle cx="26.5" cy="19" r="1.5" fill="#245C3A" />
      </svg>

      {showText ? (
        <div className="flex flex-col">
          <span className={cn("text-base font-semibold leading-tight tracking-tight text-ink", textClassName)}>
            CareThread
          </span>
          <span className="text-[11px] font-medium leading-none text-muted">
            Healthcare Continuity
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function LeafIcon({ className, size = 16, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

export function SproutIcon({ className, size = 16, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d="M7 20h10" />
      <path d="M10 20c.5-4 1.5-7 5-8" />
      <path d="M4 11a5 5 0 0 1 7.5-4.5 4.5 4.5 0 0 1 2.5 4c0 3-4 4.5-8 3.5" />
      <path d="M14 13a4.5 4.5 0 0 1 7-3.5 4.5 4.5 0 0 1 1 5c-1.5 2.5-5 2.5-8 1.5" />
    </svg>
  );
}

export function ConsentShieldIcon({ className, size = 18, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function LeafSpinner({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("animate-spin text-forest", className)}
    >
      <circle cx="12" cy="12" r="10" stroke="#E1F3E5" strokeWidth="2.5" />
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12C2 14.5 3 16.5 4.5 18"
        stroke="#245C3A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyPlantIllustration({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center p-3 select-none", className)} aria-hidden="true">
      <svg width="120" height="110" viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft background aura glow */}
        <circle cx="60" cy="55" r="44" fill="#E1F3E5" fillOpacity="0.6" />
        
        {/* Organic pot / botanical capsule */}
        <path
          d="M44 72C44 68.6863 46.6863 66 50 66H70C73.3137 66 76 68.6863 76 72V80C76 85.5228 71.5228 90 66 90H54C48.4772 90 44 85.5228 44 80V72Z"
          fill="#FFFFFF"
          stroke="#D5E6D6"
          strokeWidth="1.5"
        />
        {/* Pot rim */}
        <rect x="40" y="62" width="40" height="6" rx="3" fill="#245C3A" />
        
        {/* Sprouting seedling stem */}
        <path
          d="M60 62V38"
          stroke="#245C3A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Left leaf (organic curvature) */}
        <path
          d="M60 48C50 48 44 42 42 34C50 34 58 38 60 48Z"
          fill="#57A65C"
          stroke="#245C3A"
          strokeWidth="1.25"
        />
        {/* Right leaf (organic curvature) */}
        <path
          d="M60 44C70 44 76 38 78 30C70 30 62 34 60 44Z"
          fill="#82C96B"
          stroke="#245C3A"
          strokeWidth="1.25"
        />
        {/* Top budding leaf */}
        <path
          d="M60 38C58 30 60 22 60 22C60 22 62 30 60 38Z"
          fill="#245C3A"
        />

        {/* Small floating vitality spores */}
        <circle cx="34" cy="40" r="2" fill="#57A65C" fillOpacity="0.6" />
        <circle cx="86" cy="46" r="2.5" fill="#82C96B" fillOpacity="0.7" />
        <circle cx="78" cy="24" r="1.5" fill="#245C3A" fillOpacity="0.5" />
      </svg>
    </div>
  );
}
