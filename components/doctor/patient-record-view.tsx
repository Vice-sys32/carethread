"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LuPlus, LuTriangleAlert } from "react-icons/lu";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearConsent, getConsent } from "@/lib/auth/consent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountdownText } from "@/components/ui/countdown-text";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { MedicationsPanel } from "@/components/records/medications-panel";
import { RecordsBrowser } from "@/components/records/records-browser";
import { RecordDetailDrawer } from "@/components/records/record-detail-drawer";
import { AddVisitDrawer } from "./add-visit-drawer";
import type { MedicalRecord } from "@/types";

export function PatientRecordView({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [consent] = useState(() => getConsent());
  const [selected, setSelected] = useState<MedicalRecord | null>(null);
  const [addVisitOpen, setAddVisitOpen] = useState(false);
  const [expiredLocally, setExpiredLocally] = useState(false);

  const hasConsent = !!consent;

  const records = useQuery({
    queryKey: ["doctor-patient", patientId, "records"],
    queryFn: () => api.doctor.getPatientRecords(patientId, consent?.token ?? ""),
    enabled: hasConsent,
  });
  const medications = useQuery({
    queryKey: ["doctor-patient", patientId, "medications"],
    queryFn: () => api.doctor.getPatientMedications(patientId, consent?.token ?? ""),
    enabled: hasConsent,
  });

  const summary = useQuery({
    queryKey: ["doctor-access", patientId],
    queryFn: () => api.doctor.access({ token: consent?.token ?? "" }),
    enabled: hasConsent,
    staleTime: Infinity,
    retry: false,
  });

  const accessEnded = [records.error, medications.error, summary.error].some(
    (error) => error instanceof ApiError && error.status === 403,
  );
  const ended = accessEnded || expiredLocally;

  useEffect(() => {
    if (!hasConsent) router.replace("/doctor/find");
  }, [hasConsent, router]);

  function endSession() {
    clearConsent();
    router.replace("/doctor/find");
  }

  if (!hasConsent) return null;

  const patient = summary.data?.patient_summary;

  return (
    <div className="flex flex-col gap-5">
      <Card className="px-4 py-3">
        {summary.isPending ? (
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
        ) : summary.isError ? (
          summary.error instanceof ApiError && summary.error.status === 403 ? (
            <p className="text-sm text-danger">The sharing window for this record has ended.</p>
          ) : (
            <p className="text-sm text-danger">Could not load the patient summary.</p>
          )
        ) : patient ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p className="text-sm font-semibold text-ink">{patient.name}</p>
              <p className="text-xs text-muted">Patient</p>
            </div>
            <div>
              <p className="font-mono text-sm tabular-nums text-ink">{patient.age}</p>
              <p className="text-xs text-muted">Age{patient.sex ? `, ${patient.sex}` : ""}</p>
            </div>
            <div>
              <p className="font-mono text-sm tabular-nums text-ink">{patient.blood_group}</p>
              <p className="text-xs text-muted">Blood group</p>
            </div>
            <div className="min-w-40">
              {patient.allergies ? (
                <p className="flex items-center gap-1.5 text-[13px] text-warning">
                  <LuTriangleAlert aria-hidden className="size-3.5 shrink-0" />
                  Allergies: {patient.allergies}
                </p>
              ) : (
                <p className="text-[13px] text-muted">No known allergies</p>
              )}
              <p className="text-xs text-muted">Allergies</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted">Access ends in</p>
              <CountdownText expiresAt={summary.data?.expires_at} onExpire={() => setExpiredLocally(true)} className="text-sm" />
            </div>
            <Button onClick={() => setAddVisitOpen(true)}>
              <LuPlus aria-hidden className="size-4" />
              Add visit
            </Button>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <RecordsBrowser
            records={records.data}
            isLoading={records.isPending}
            isError={records.isError && !(records.error instanceof ApiError && records.error.status === 403)}
            onRetry={() => records.refetch()}
            onSelect={setSelected}
            emptyTitle="No medical records for this patient."
            emptyDescription="Records added by doctors or uploaded by the patient will appear here."
          />
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <MedicationsPanel
              medications={medications.data}
              isLoading={medications.isPending}
              isError={medications.isError && !(medications.error instanceof ApiError && medications.error.status === 403)}
              onRetry={() => medications.refetch()}
            />
          </div>
        </aside>
      </div>

      <details className="lg:hidden">
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

      <RecordDetailDrawer record={selected} onClose={() => setSelected(null)} />

      <AddVisitDrawer
        open={addVisitOpen}
        onClose={() => setAddVisitOpen(false)}
        patientId={patientId}
        consentToken={consent.token}
      />

      <Modal
        open={ended}
        onClose={endSession}
        title="Access window has ended"
        description="This patient's sharing window has closed. Ask for a new access code to view the records again."
      >
        <div className="flex justify-end">
          <Button size="sm" onClick={endSession}>
            Back to Find patient
          </Button>
        </div>
      </Modal>
    </div>
  );
}
