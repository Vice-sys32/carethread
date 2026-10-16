"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { ACTION_LABELS, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import type { AccessLogEntry } from "@/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function AccessLogView() {
  const [result, setResult] = useState<"all" | "allowed" | "denied">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const log = useQuery({ queryKey: ["access-log"], queryFn: () => api.patient.getAccessLog() });

  const entries = useMemo(() => {
    const all = log.data ?? [];
    return all.filter((entry) => {
      if (result === "allowed" && !entry.allowed) return false;
      if (result === "denied" && entry.allowed) return false;
      const day = entry.at.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [log.data, result, from, to]);

  const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = entries.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          ariaLabel="Filter by result"
          value={result}
          onChange={setResult}
          options={[
            { value: "all", label: "All" },
            { value: "allowed", label: "Allowed" },
            { value: "denied", label: "Denied" },
          ]}
        />
        <Input aria-label="From date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-36" />
        <Input aria-label="To date" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-36" />
        {result !== "all" || from || to ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setResult("all");
              setFrom("");
              setTo("");
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {log.isPending ? (
        <div className="h-64 animate-pulse rounded-card bg-line/70" />
      ) : log.isError ? (
        <ErrorState message="Could not load the access log." onRetry={() => log.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No access activity for these filters."
          description="Doctor access, including denied attempts, will be listed here."
        />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Date and time</Th>
                <Th>Doctor</Th>
                <Th>Hospital</Th>
                <Th>Action</Th>
                <Th>Result</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry: AccessLogEntry) => (
                <Tr key={entry.id} className={cn(!entry.allowed && "bg-danger-tint/60 hover:bg-danger-tint")}>
                  <Td className="whitespace-nowrap font-mono text-xs tabular-nums">{formatDateTime(entry.at)}</Td>
                  <Td className="font-medium">{entry.doctor_name}</Td>
                  <Td className="text-secondary">{entry.hospital_name}</Td>
                  <Td>{ACTION_LABELS[entry.action]}</Td>
                  <Td>
                    <Badge tone={entry.allowed ? "success" : "danger"}>{entry.allowed ? "Allowed" : "Denied"}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-secondary">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </p>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" disabled={current <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <span className="font-mono text-xs tabular-nums text-secondary">
                Page {current} of {pages}
              </span>
              <Button variant="secondary" size="sm" disabled={current >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
