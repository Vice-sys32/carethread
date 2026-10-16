"use client";

import { LuPrinter, LuTriangleAlert } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { ageFromDob, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function EmergencyView() {
  const profile = useQuery({ queryKey: ["patient-profile"], queryFn: () => api.patient.getProfile() });
  const medications = useQuery({ queryKey: ["medications"], queryFn: () => api.patient.getMedications() });

  if (profile.isPending || medications.isPending) {
    return <Skeleton className="h-96 w-full max-w-2xl" />;
  }
  if (profile.isError) {
    return <ErrorState message="Could not load the emergency card." onRetry={() => profile.refetch()} />;
  }

  const data = profile.data;
  const currentMedications = (medications.data ?? []).filter((m) => m.status === "current");

  return (
    <Card className="mx-auto w-full max-w-2xl p-6 print:max-w-none print:border-0 print:p-0">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-ink">{data.full_name}</p>
          <p className="text-xs text-muted">Emergency card</p>
        </div>
        <Button variant="secondary" size="sm" className="print:hidden" onClick={() => window.print()}>
          <LuPrinter aria-hidden className="size-4" />
          Print
        </Button>
      </div>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted">Age</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-ink">{ageFromDob(data.date_of_birth)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Date of birth</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-ink">{formatDate(data.date_of_birth)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Blood group</dt>
          <dd className="mt-0.5">
            <Badge tone="danger">{data.blood_group}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Phone</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-ink">{data.phone}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-muted">Known allergies</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-ink">
            {data.allergies ? (
              <>
                <LuTriangleAlert aria-hidden className="size-3.5 shrink-0 text-warning" />
                {data.allergies}
              </>
            ) : (
              <span className="text-muted">None recorded</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Emergency contact</dt>
          <dd className="mt-0.5 text-sm text-ink">{data.emergency_contact_name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Emergency contact phone</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-ink">{data.emergency_contact_phone}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-muted">Current medications</dt>
          <dd className="mt-0.5">
            {currentMedications.length === 0 ? (
              <span className="text-sm text-muted">None recorded</span>
            ) : (
              <ul className="flex flex-col gap-1">
                {currentMedications.map((medication) => (
                  <li key={medication.id} className="text-sm text-ink">
                    {medication.name} {medication.dose} · {medication.frequency}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
