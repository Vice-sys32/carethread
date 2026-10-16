"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LuUpload } from "react-icons/lu";
import { api } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { RecordsBrowser } from "./records-browser";
import { RecordDetailDrawer } from "./record-detail-drawer";
import { MedicationsPanel } from "./medications-panel";
import type { MedicalRecord } from "@/types";

export function TimelineView() {
  const router = useRouter();
  const [selected, setSelected] = useState<MedicalRecord | null>(null);
  const records = useQuery({ queryKey: ["records"], queryFn: () => api.patient.getRecords() });
  const medications = useQuery({ queryKey: ["medications"], queryFn: () => api.patient.getMedications() });

  return (
    <div>
      <div className="mb-5 flex items-center justify-end">
        <Button onClick={() => router.push("/patient/upload")}>
          <LuUpload aria-hidden className="size-4" />
          Upload record
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <RecordsBrowser
            records={records.data}
            isLoading={records.isPending}
            isError={records.isError}
            onRetry={() => records.refetch()}
            onSelect={setSelected}
            emptyTitle="No medical records yet."
            emptyDescription="Uploaded reports and doctor visits will appear here."
            emptyAction={
              <Button size="sm" onClick={() => router.push("/patient/upload")}>
                <LuUpload aria-hidden className="size-3.5" />
                Upload record
              </Button>
            }
          />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <MedicationsPanel
              medications={medications.data}
              isLoading={medications.isPending}
              isError={medications.isError}
              onRetry={() => medications.refetch()}
            />
          </div>
        </aside>
      </div>

      <details className="mt-6 lg:hidden">
        <summary className="flex cursor-default select-none items-center justify-between rounded-card border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          Current medications
          <span className="text-xs font-normal text-muted">Tap to expand</span>
        </summary>
        <MedicationsPanel
          className="mt-2"
          medications={medications.data}
          isLoading={medications.isPending}
          isError={medications.isError}
          onRetry={() => medications.refetch()}
        />
      </details>

      <RecordDetailDrawer record={selected} onClose={() => setSelected(null)} showFile />
    </div>
  );
}
