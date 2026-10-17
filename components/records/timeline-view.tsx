"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LuPill, LuPlus, LuUpload } from "react-icons/lu";
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
    <div className="flex flex-col gap-6">
      {/* Top Banner with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-card border border-line bg-gradient-to-r from-mint/40 via-surface to-mint/20 p-5 shadow-subtle">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-forest-dark">
            Medical History Timeline
          </h2>
          <p className="mt-0.5 text-xs text-muted max-w-lg leading-relaxed">
            Consolidated timeline across hospitals, clinics, and doctor visits. Filter by record category or search by diagnosis.
          </p>
        </div>
        <div className="shrink-0">
          <Button onClick={() => router.push("/patient/upload")} size="md" className="gap-2">
            <LuUpload aria-hidden className="size-4" />
            <span>Upload record</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Records Browser + Sticky Medications Panel */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <RecordsBrowser
            records={records.data}
            isLoading={records.isPending}
            isError={records.isError}
            onRetry={() => records.refetch()}
            onSelect={setSelected}
            emptyTitle="No medical records yet."
            emptyDescription="Upload your discharge summaries, prescriptions, or lab reports to sprout your health thread."
            emptyAction={
              <Button size="sm" onClick={() => router.push("/patient/upload")} className="gap-1.5 mt-2">
                <LuPlus aria-hidden className="size-3.5" />
                Upload first record
              </Button>
            }
          />
        </div>

        {/* Desktop Sidebar: Medications Panel */}
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

      {/* Mobile Accordion for Medications */}
      <details className="mt-2 lg:hidden group rounded-card border border-line bg-surface overflow-hidden shadow-subtle">
        <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-semibold text-ink hover:bg-mint/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/25">
          <div className="flex items-center gap-2">
            <LuPill aria-hidden className="size-4 text-leaf" />
            <span>Current medications</span>
          </div>
          <span className="text-xs font-normal text-muted group-open:hidden">Tap to view</span>
        </summary>
        <div className="p-3 border-t border-line bg-app/20">
          <MedicationsPanel
            medications={medications.data}
            isLoading={medications.isPending}
            isError={medications.isError}
            onRetry={() => medications.refetch()}
          />
        </div>
      </details>

      <RecordDetailDrawer record={selected} onClose={() => setSelected(null)} showFile />
    </div>
  );
}
