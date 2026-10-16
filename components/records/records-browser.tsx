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
  { value: "all", label: "All" },
  { value: "visit", label: "Visits" },
  { value: "prescription", label: "Prescriptions" },
  { value: "lab_report", label: "Lab reports" },
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
          <Skeleton key={i} className="h-7 w-20" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 min-w-48 flex-1" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
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
  if (isError) return <ErrorState message="Could not load the record list." onRetry={onRetry} />;

  const hasFilters = type !== "all" || query.trim() !== "" || hospital !== "all" || from !== "" || to !== "";

  if (all.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className="border-solid border-line"
      />
    );
  }

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filter by record type">
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
                "flex shrink-0 items-center gap-1.5 rounded-input border px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                active ? "border-accent bg-accent-tint text-accent-strong" : "border-line bg-surface text-secondary hover:bg-app hover:text-ink",
              )}
            >
              {filter.label}
              <span className="font-mono text-xs tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <LuSearch aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            aria-label="Search records"
            placeholder="Search records"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          aria-label="Hospital or clinic"
          value={hospital}
          onChange={(event) => setHospital(event.target.value)}
          className="w-44"
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
          className="w-36"
        />
        <Input
          aria-label="To date"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="w-36"
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
          >
            <LuX aria-hidden className="size-3.5" />
            Clear
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No records match these filters."
          description="Adjust the search, hospital or date range to see more records."
          action={
            <Button variant="secondary" size="sm" onClick={() => { setType("all"); setQuery(""); setHospital("all"); setFrom(""); setTo(""); }}>
              Clear filters
            </Button>
          }
          className="mt-5"
        />
      ) : (
        <div className="mt-5 flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.year}>
              <h2 className="text-base font-semibold text-ink">{group.year}</h2>
              {group.months.map(({ month, items }) => (
                <div key={month} className="mt-3">
                  <h3 className="text-xs font-medium text-muted">{MONTHS_LONG[month]}</h3>
                  <ul className="ml-1.5 mt-1.5 border-l border-line">
                    {items.map((record) => (
                      <li key={record.id} className="relative pl-5">
                        <span aria-hidden className="absolute -left-[4.5px] top-6 size-2 rounded-full border border-line-strong bg-surface" />
                        <button
                          type="button"
                          onClick={() => onSelect(record)}
                          className="w-full rounded-card border border-transparent px-3 py-2.5 text-left transition-colors duration-150 hover:border-line hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <time className="w-[86px] shrink-0 font-mono text-xs tabular-nums text-secondary">
                              {formatDate(record.record_date)}
                            </time>
                            <RecordBadge type={record.type} />
                            <span className="ml-auto text-xs text-muted">{SOURCE_LABELS[record.source]}</span>
                          </div>
                          <p className="mt-1.5 text-sm font-medium text-ink">{record.title}</p>
                          <p className="text-[13px] text-secondary">
                            {record.hospital_name} · {record.doctor_name}
                          </p>
                          {record.diagnosis ? (
                            <p className="mt-1 line-clamp-1 text-[13px] text-muted">{record.diagnosis}</p>
                          ) : null}
                          {record.remarks ? (
                            <p className="line-clamp-1 text-[13px] text-muted">{record.remarks}</p>
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
