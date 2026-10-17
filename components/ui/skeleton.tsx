export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-line/70 ${className ?? ""}`} />;
}
