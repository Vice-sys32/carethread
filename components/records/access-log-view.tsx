"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LuCheck, LuEye, LuShieldAlert, LuX } from "react-icons/lu";
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
    <div className="flex flex-col gap-6">
      {/* Transparency Header Banner */}
      <div className="rounded-card border border-line bg-gradient-to-r from-mint/40 via-surface to-mint/20 p-5 shadow-subtle">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-forest border border-leaf/30 shadow-subtle">
            <LuEye className="size-5 text-leaf" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-forest-dark">
              Access Transparency & Audit Trail
            </h2>
            <p className="mt-0.5 text-xs text-muted max-w-2xl leading-relaxed">
              Every attempt to view your medical timeline by a physician or clinic is recorded here. Both authorized visits and unauthorized attempts are logged so you know exactly who accessed your data.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-3 shadow-subtle">
        <div className="w-full sm:w-auto">
          <Segmented
            ariaLabel="Filter by result"
            value={result}
            onChange={(next) => {
              setResult(next);
              setPage(1);
            }}
            options={[
              { value: "all", label: "All Activity" },
              { value: "allowed", label: "Allowed" },
              { value: "denied", label: "Denied" },
            ]}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">From:</span>
          <Input
            aria-label="From date"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="w-34 h-8.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">To:</span>
          <Input
            aria-label="To date"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
            className="w-34 h-8.5 text-xs"
          />
        </div>

        {result !== "all" || from || to ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setResult("all");
              setFrom("");
              setTo("");
              setPage(1);
            }}
            className="text-secondary hover:text-forest"
          >
            <LuX aria-hidden className="size-3.5" />
            <span>Reset filters</span>
          </Button>
        ) : null}
      </div>

      {/* Table & Pagination */}
      {log.isPending ? (
        <div className="h-64 animate-pulse rounded-card bg-line/60" />
      ) : log.isError ? (
        <ErrorState message="Could not load the access log." onRetry={() => log.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No access activity matches these filters."
          description="Doctor visits and access attempts will appear here with exact timestamps."
          showPlant={false}
          action={
            result !== "all" || from || to ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setResult("all");
                  setFrom("");
                  setTo("");
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <Table>
            <thead>
              <tr>
                <Th>Date & Time</Th>
                <Th>Doctor</Th>
                <Th>Hospital / Clinic</Th>
                <Th>Action Taken</Th>
                <Th>Verification Result</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry: AccessLogEntry) => (
                <Tr
                  key={entry.id}
                  className={cn(
                    !entry.allowed && "bg-danger-tint/30 hover:bg-danger-tint/50 border-l-2 border-l-danger",
                  )}
                >
                  <Td className="whitespace-nowrap font-mono text-xs tabular-nums text-forest-dark font-medium">
                    {formatDateTime(entry.at)}
                  </Td>
                  <Td className="font-semibold text-ink">{entry.doctor_name}</Td>
                  <Td className="text-secondary">{entry.hospital_name}</Td>
                  <Td className="text-xs">{ACTION_LABELS[entry.action]}</Td>
                  <Td>
                    {entry.allowed ? (
                      <Badge tone="success" dot className="gap-1">
                        <LuCheck className="size-3" />
                        <span>Allowed</span>
                      </Badge>
                    ) : (
                      <Badge tone="danger" dot className="gap-1">
                        <LuShieldAlert className="size-3" />
                        <span>Access Denied</span>
                      </Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 pt-2">
            <p className="text-xs text-muted">
              Showing <span className="font-semibold text-ink">{entries.length}</span> recorded {entries.length === 1 ? "event" : "events"}
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={current <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="font-mono text-xs tabular-nums text-secondary px-2">
                Page {current} of {pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={current >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
