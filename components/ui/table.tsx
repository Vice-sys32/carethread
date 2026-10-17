import { cn } from "@/lib/utils";

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-x-auto rounded-card border border-line bg-surface shadow-subtle", className)}>
      <table className="w-full min-w-[560px] border-collapse text-sm [&_tbody_tr:last-child_td]:border-b-0">
        {children}
      </table>
    </div>
  );
}

export function Th({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-app/80 px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Tr({ className, children }: { className?: string; children: React.ReactNode }) {
  return <tr className={cn("transition-colors duration-150 hover:bg-mint/25", className)}>{children}</tr>;
}

export function Td({ className, children }: { className?: string; children: React.ReactNode }) {
  return <td className={cn("border-b border-line px-4 py-3 align-middle text-ink", className)}>{children}</td>;
}
