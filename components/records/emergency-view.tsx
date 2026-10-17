"use client";

import { LuHeartPulse, LuPhone, LuPill, LuPrinter, LuShieldAlert, LuUser } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { ageFromDob, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CareThreadLogo } from "@/components/ui/botanical-icons";

export function EmergencyView() {
  const profile = useQuery({ queryKey: ["patient-profile"], queryFn: () => api.patient.getProfile() });
  const medications = useQuery({ queryKey: ["medications"], queryFn: () => api.patient.getMedications() });

  if (profile.isPending || medications.isPending) {
    return <Skeleton className="h-96 w-full max-w-2xl mx-auto rounded-card" />;
  }
  if (profile.isError) {
    return <ErrorState message="Could not load the emergency card." onRetry={() => profile.refetch()} />;
  }

  const data = profile.data;
  const currentMedications = (medications.data ?? []).filter((m) => m.status === "current");

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-2xl bg-white border border-line shadow-card p-6 sm:p-8 print:shadow-none print:border print:border-gray-300 print:p-6 print:max-w-none">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 border-b border-line pb-5 print:border-gray-200">
          <div className="flex items-center gap-3">
            <CareThreadLogo size={38} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-forest-dark">{data.full_name}</h1>
                <Badge tone="accent" className="text-[10px] uppercase font-bold">Emergency Card</Badge>
              </div>
              <p className="text-xs text-muted">CareThread Verified Patient Clinical Summary</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="print:hidden gap-1.5"
            onClick={() => window.print()}
          >
            <LuPrinter aria-hidden className="size-4" />
            <span>Print Card</span>
          </Button>
        </div>

        {/* Critical Vitals & Blood Group Banner */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-card bg-app/50 p-4 border border-line print:bg-gray-50">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Blood Group</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-xl font-bold text-danger font-mono">{data.blood_group}</span>
              <Badge tone="danger" className="text-[10px] py-0 px-1 font-bold">Rh Factor</Badge>
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Age / Sex</span>
            <p className="mt-1 text-sm font-bold text-ink font-mono">{ageFromDob(data.date_of_birth)} yrs</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Date of Birth</span>
            <p className="mt-1 text-sm font-semibold text-ink font-mono">{formatDate(data.date_of_birth)}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Patient Phone</span>
            <p className="mt-1 text-sm font-semibold text-ink font-mono">{data.phone}</p>
          </div>
        </div>

        {/* Known Allergies Warning Box */}
        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-dark flex items-center gap-1.5">
            <LuShieldAlert className="size-4 text-warning" />
            <span>Critical Allergies</span>
          </span>
          <div className="mt-2 rounded-card border-2 border-warning/40 bg-warning-tint/50 p-3.5">
            {data.allergies ? (
              <p className="text-sm font-bold text-warning flex items-start gap-2">
                <span className="size-2 rounded-full bg-warning mt-1.5 shrink-0" />
                <span>{data.allergies}</span>
              </p>
            ) : (
              <p className="text-xs font-medium text-muted">
                No known drug or environmental allergies recorded.
              </p>
            )}
          </div>
        </div>

        {/* Emergency Contact Group */}
        <div className="mt-5 rounded-card border border-line bg-surface p-4 shadow-subtle">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-dark flex items-center gap-1.5">
            <LuUser className="size-4 text-leaf" />
            <span>Emergency Contact</span>
          </span>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-muted">Contact Person</span>
              <p className="mt-0.5 text-sm font-semibold text-ink">{data.emergency_contact_name}</p>
            </div>
            <div>
              <span className="text-[11px] text-muted">Emergency Phone</span>
              <p className="mt-0.5 text-sm font-bold text-forest font-mono flex items-center gap-1.5">
                <LuPhone className="size-3.5 text-leaf" />
                <span>{data.emergency_contact_phone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Current Medications Group */}
        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-dark flex items-center gap-1.5">
            <LuPill className="size-4 text-leaf" />
            <span>Active Prescriptions & Dosages</span>
          </span>
          <div className="mt-2 rounded-card border border-line bg-app/30 p-4">
            {currentMedications.length === 0 ? (
              <p className="text-xs text-muted">No active medications currently on file.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {currentMedications.map((medication) => (
                  <li
                    key={medication.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2 last:border-b-0 last:pb-0 text-xs sm:text-sm"
                  >
                    <div>
                      <span className="font-semibold text-ink">{medication.name}</span>
                      <span className="ml-1.5 font-medium text-forest">{medication.dose}</span>
                    </div>
                    <span className="text-xs text-secondary font-medium">{medication.frequency}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Medical Card Footer */}
        <div className="mt-6 border-t border-line pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted">
          <p>Generated via CareThread Unified Healthcare Platform.</p>
          <p className="font-mono">Document verification: CT-EMRG-{data.phone.slice(-4)}</p>
        </div>
      </Card>

      <p className="text-xs text-muted print:hidden">
        Keep this card saved or printed in your wallet for immediate access by emergency response teams.
      </p>
    </div>
  );
}
