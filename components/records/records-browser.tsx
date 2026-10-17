"use client";

import { useMemo, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import { RecordBadge } from "./record-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MONTHS_LONG, SOURCE_LABELS, formatDate } from "@/lib/utils";
import type { MedicalRecord, RecordType } from "@/types";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: { value: RecordType | "all"; label: string }[] = [
  { value: "all", label: "All Records" },
  { value: "visit", label: "Visits" },
  { value: "prescription", label: "Prescriptions" },
  { value: "lab_report", label: "Lab Reports" },
  { value: "vaccine", label: "Vaccines" },
  { value: "imaging", label: "Imaging" },
  { value: "other", label: "Other" },
];

interface RecordsBrowserProps {
  records: MedicalRecord[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelect: (record: MedicalRecord) => void;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-input" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 min-w-48 flex-1 rounded-input" />
        <Skeleton className="h-9 w-40 rounded-input" />
        <Skeleton className="h-9 w-36 rounded-input" />
        <Skeleton className="h-9 w-36 rounded-input" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-card" />
        ))}
      </div>
    </div>
  );
}

export function RecordsBrowser({
  records,
  isLoading,
  isError,
  onRetry,
  onSelect,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: RecordsBrowserProps) {
  const [type, setType] = useState<RecordType | "all">("all");
  const [query, setQuery] = useState("");
  const [hospital, setHospital] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const all = useMemo(() => records ?? [], [records]);
  const hospitals = useMemo(() => [...new Set(all.map((r) => r.hospital_name))].sort(), [all]);

  const counts = useMemo(() => {
    const map = new Map<RecordType, number>();
    for (const r of all) map.set(r.type, (map.get(r.type) ?? 0) + 1);
    return map;
  }, [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((r) => {
      if (type !== "all" && r.type !== type) return false;
      if (hospital !== "all" && r.hospital_name !== hospital) return false;
      if (from && r.record_date < from) return false;
      if (to && r.record_date > to) return false;
      if (q && ![r.title, r.diagnosis, r.remarks, r.doctor_name, r.hospital_name].some((field) => field?.toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });
  }, [all, type, hospital, from, to, query]);

  const groups = useMemo(() => {
    const byYear = new Map<number, Map<number, MedicalRecord[]>>();
    for (const record of filtered) {
      const date = new Date(`${record.record_date}T00:00:00`);
      const year = date.getFullYear();
      const month = date.getMonth();
      if (!byYear.has(year)) byYear.set(year, new Map());
      const byMonth = byYear.get(year);
      if (!byMonth) continue;
      if (!byMonth.has(month)) byMonth.set(month, []);
      byMonth.get(month)?.push(record);
    }
    return [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, months]) => ({
        year,
        months: [...months.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([month, items]) => ({ month, items })),
      }));
  }, [filtered]);

  if (isLoading) return <TimelineSkeleton />;
  if (isError) return <ErrorState message="Could not load the medical records list." onRetry={onRetry} />;

  const hasFilters = type !== "all" || query.trim() !== "" || hospital !== "all" || from !== "" || to !== "";

  if (all.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Category Filter Pills with Item Counts */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 select-none" role="group" aria-label="Filter by record type">
        {TYPE_FILTERS.map((filter) => {
          const active = type === filter.value;
          const count = filter.value === "all" ? all.length : (counts.get(filter.value) ?? 0);
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={active}
              onClick={() => setType(filter.value)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-input border px-3 py-1.5 text-xs sm:text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/25",
                active
                  ? "border-forest bg-mint text-forest-dark font-semibold shadow-subtle"
                  : "border-line bg-surface text-secondary hover:border-leaf/50 hover:bg-mint/30 hover:text-ink",
              )}
            >
              <span>{filter.label}</span>
              <span
                className={cn(
                  "font-mono text-xs tabular-nums px-1.5 py-0.2 rounded-full",
                  active ? "bg-forest text-white" : "bg-app text-muted",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Date Controls Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-2.5 shadow-subtle">
        <div className="relative min-w-44 flex-1">
          <LuSearch aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            aria-label="Search records"
            placeholder="Search diagnosis, hospital, doctor..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9 h-8.5 text-xs sm:text-sm"
          />
        </div>
        <Select
          aria-label="Hospital or clinic"
          value={hospital}
          onChange={(event) => setHospital(event.target.value)}
          className="w-40 sm:w-44 h-8.5 text-xs sm:text-sm"
        >
          <option value="all">All hospitals</option>
          {hospitals.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <Input
          aria-label="From date"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="w-32 sm:w-36 h-8.5 text-xs"
        />
        <Input
          aria-label="To date"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="w-32 sm:w-36 h-8.5 text-xs"
        />
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setType("all");
              setQuery("");
              setHospital("all");
              setFrom("");
              setTo("");
            }}
            className="text-secondary hover:text-forest"
          >
            <LuX aria-hidden className="size-3.5" />
            <span>Reset</span>
          </Button>
        ) : null}
      </div>

      {/* Filtered Results or Empty Filter State */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No records match your filters."
          description="Try broadening the search query, selecting another hospital, or clearing the date limits."
          showPlant={false}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setType("all");
                setQuery("");
                setHospital("all");
                setFrom("");
                setTo("");
              }}
            >
              Clear filters
            </Button>
          }
          className="mt-3"
        />
      ) : (
        <div className="mt-2 flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.year} className="relative">
              {/* Year Heading with Botanical Sprout */}
              <div className="flex items-center gap-2 pb-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-mint text-forest font-bold text-xs border border-leaf/30 shadow-subtle">
                  {String(group.year).slice(-2)}
                </span>
                <h2 className="text-base font-bold tracking-tight text-forest-dark">{group.year}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-line to-transparent" aria-hidden="true" />
              </div>

              {group.months.map(({ month, items }) => (
                <div key={month} className="mt-3">
                  <h3 className="ml-9 text-xs font-semibold uppercase tracking-wider text-muted">
                    {MONTHS_LONG[month]}
                  </h3>
                  {/* Botanical Vine Tree Line */}
                  <ul className="ml-3.5 mt-2 border-l-2 border-line-strong/70 flex flex-col gap-3">
                    {items.map((record) => (
                      <li key={record.id} className="relative pl-6">
                        {/* Botanical Vine Leaf/Bud Node */}
                        <span
                          aria-hidden
                          className="absolute -left-[7px] top-4.5 size-3 rounded-full border-2 border-surface bg-leaf shadow-xs transition-transform duration-150 hover:scale-125"
                        />
                        <button
                          type="button"
                          onClick={() => onSelect(record)}
                          className="w-full rounded-card border border-line bg-surface p-4 text-left shadow-subtle transition-all duration-150 hover:border-leaf hover:shadow-card hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/25"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <RecordBadge type={record.type} />
                              <time className="font-mono text-xs font-medium tabular-nums text-forest">
                                {formatDate(record.record_date)}
                              </time>
                            </div>
                            <span className="rounded bg-app px-2 py-0.5 text-[11px] font-medium text-muted border border-line/60">
                              {SOURCE_LABELS[record.source]}
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-semibold text-ink group-hover:text-forest transition-colors">
                            {record.title}
                          </p>

                          <p className="mt-0.5 text-xs text-secondary">
                            <span className="font-medium text-ink/80">{record.hospital_name}</span> · {record.doctor_name}
                          </p>

                          {record.diagnosis ? (
                            <div className="mt-2 rounded bg-mint/30 px-2.5 py-1 text-xs text-forest-dark border border-leaf/15">
                              <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                            </div>
                          ) : null}

                          {record.remarks ? (
                            <p className="mt-1.5 line-clamp-2 text-xs text-muted leading-relaxed">
                              {record.remarks}
                            </p>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
