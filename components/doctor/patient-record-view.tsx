"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LuClock, LuPlus, LuShieldAlert, LuStethoscope, LuUser } from "react-icons/lu";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearConsent, getConsent } from "@/lib/auth/consent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountdownText } from "@/components/ui/countdown-text";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-6">
      {/* Patient Clinical Summary Banner */}
      <Card className="p-5 shadow-card border-line bg-surface">
        {summary.isPending ? (
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-6 w-44 rounded-input" />
            <Skeleton className="h-6 w-24 rounded-input" />
            <Skeleton className="h-6 w-24 rounded-input" />
            <Skeleton className="h-6 w-40 rounded-input" />
          </div>
        ) : summary.isError ? (
          summary.error instanceof ApiError && summary.error.status === 403 ? (
            <div className="flex items-center gap-2 text-danger font-medium text-sm">
              <LuShieldAlert className="size-5" />
              <span>The patient&apos;s sharing window for this record has ended.</span>
            </div>
          ) : (
            <p className="text-sm text-danger">Could not load the patient summary.</p>
          )
        ) : patient ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-mint text-forest font-bold text-sm border border-leaf/30 shadow-subtle">
                  <LuUser className="size-5 text-forest" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-ink">{patient.name}</h1>
                  <p className="text-xs text-muted">Authorized Patient Chart</p>
                </div>
              </div>

              <div className="h-8 w-px bg-line hidden md:block" aria-hidden="true" />

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Age / Sex</span>
                <p className="font-mono text-sm font-semibold tabular-nums text-ink">
                  {patient.age} yrs{patient.sex ? `, ${patient.sex}` : ""}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Blood Group</span>
                <div className="mt-0.5">
                  <Badge tone="danger" className="text-xs font-bold">
                    {patient.blood_group}
                  </Badge>
                </div>
              </div>

              <div className="min-w-40">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Known Allergies</span>
                {patient.allergies ? (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-warning mt-0.5">
                    <LuShieldAlert aria-hidden className="size-3.5 shrink-0" />
                    <span>{patient.allergies}</span>
                  </p>
                ) : (
                  <p className="text-xs text-muted mt-0.5">No known allergies</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-medium text-muted flex items-center gap-1">
                  <LuClock className="size-3 text-leaf" />
                  <span>Access window ends in:</span>
                </span>
                <div className="font-mono text-xs sm:text-sm font-semibold text-forest">
                  <CountdownText
                    expiresAt={summary.data?.expires_at}
                    onExpire={() => setExpiredLocally(true)}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setAddVisitOpen(true)}
                className="gap-2"
              >
                <LuPlus aria-hidden className="size-4" />
                <span>Add Visit Record</span>
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Medical Timeline and Medications Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <RecordsBrowser
            records={records.data}
            isLoading={records.isPending}
            isError={records.isError && !(records.error instanceof ApiError && records.error.status === 403)}
            onRetry={() => records.refetch()}
            onSelect={setSelected}
            emptyTitle="No medical records found for this patient."
            emptyDescription="Historical records and previous doctor entries will be displayed here."
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

      {/* Mobile Medications Accordion */}
      <details className="lg:hidden group rounded-card border border-line bg-surface overflow-hidden shadow-subtle">
        <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-semibold text-ink hover:bg-mint/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/25">
          <div className="flex items-center gap-2">
            <LuStethoscope aria-hidden className="size-4 text-leaf" />
            <span>Current Medications</span>
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

      <RecordDetailDrawer record={selected} onClose={() => setSelected(null)} />

      <AddVisitDrawer
        open={addVisitOpen}
        onClose={() => setAddVisitOpen(false)}
        patientId={patientId}
        consentToken={consent.token}
      />

      {/* Automatic Window Expiration Modal */}
      <Modal
        open={ended}
        onClose={endSession}
        title="Sharing Window Has Closed"
        description="The patient's time-limited consent window has expired or was revoked. To view records again, request a new access code from the patient."
      >
        <div className="flex justify-end mt-3">
          <Button variant="primary" size="sm" onClick={endSession}>
            Return to Find Patient
          </Button>
        </div>
      </Modal>
    </div>
  );
}
