"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuCamera, LuClock, LuExternalLink, LuKey, LuSearch, LuStethoscope } from "react-icons/lu";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { saveConsent } from "@/lib/auth/consent";
import { formatDateTime, tokenFromInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CountdownText } from "@/components/ui/countdown-text";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormBanner } from "@/components/forms/form-banner";
import { ScannerModal } from "./scanner-modal";

export function FindView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tokenInput, setTokenInput] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const access = useMutation({
    mutationFn: (token: string) => api.doctor.access({ token }),
    onSuccess: async (result, token) => {
      saveConsent({ token, expiresAt: result.expires_at });
      queryClient.setQueryData(["doctor-access", result.patient_id], result);
      router.push(`/doctor/patient/${result.patient_id}`);
    },
  });

  const recent = useQuery({ queryKey: ["doctor-recent"], queryFn: () => api.doctor.getRecent() });

  const handleScan = (value: string) => {
    access.mutate(tokenFromInput(value));
  };

  function openPatient(patientId: string, token: string, expiresAt: string) {
    saveConsent({ token, expiresAt });
    router.push(`/doctor/patient/${patientId}`);
  }

  const recentPatients = recent.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Clinical Portal Header Banner */}
      <div className="rounded-card border border-line bg-gradient-to-r from-mint/40 via-surface to-mint/20 p-5 shadow-subtle">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-forest border border-leaf/30 shadow-subtle">
            <LuStethoscope className="size-5 text-leaf" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-forest-dark">
              Clinical Access & Patient Consultation
            </h2>
            <p className="mt-0.5 text-xs text-muted max-w-2xl leading-relaxed">
              Open a patient&apos;s medical records using their time-limited QR code or access link. Medical records are shared only with direct patient consent.
            </p>
          </div>
        </div>
      </div>

      {/* Access Code Input Card */}
      <Card className="mx-auto w-full max-w-xl shadow-card">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <LuKey className="size-4 text-leaf" />
              <span>Open Shared Patient Record</span>
            </div>
          }
          description="Scan the patient's QR code with your webcam, or paste the 32-character access token/link."
        />
        <CardBody className="flex flex-col gap-4 p-6">
          {access.isError ? (
            <FormBanner
              message={
                access.error instanceof ApiError
                  ? access.error.message
                  : "Access denied: this link has expired, was revoked by the patient, or is invalid."
              }
            />
          ) : null}

          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              access.mutate(tokenFromInput(tokenInput));
            }}
            noValidate
          >
            <Field id="token" label="Patient Access Token or Link" required hint="E.g., paste https://... or the 32-character code">
              <Input
                id="token"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Paste share link or enter access token..."
                className="font-mono text-xs"
                autoComplete="off"
              />
            </Field>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={access.isPending}
                disabled={!tokenInput.trim()}
                className="gap-2 flex-1 sm:flex-none"
              >
                <LuSearch className="size-4" />
                <span>Open Patient Record</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setScanOpen(true)}
                className="gap-2 flex-1 sm:flex-none"
              >
                <LuCamera aria-hidden className="size-4 text-forest" />
                <span>Scan Patient QR</span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Recent Patients Table */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-forest-dark">
            Recent Patients (Active Sharing Windows)
          </h2>
          <Badge tone="leaf" dot className="text-xs">
            {recentPatients.length} Active Windows
          </Badge>
        </div>

        {recent.isPending ? (
          <div className="h-28 animate-pulse rounded-card bg-line/60" />
        ) : recent.isError ? (
          <ErrorState message="Could not load your recent patients list." onRetry={() => recent.refetch()} />
        ) : recentPatients.length === 0 ? (
          <EmptyState
            title="No active patient sharing windows."
            description="Patients you have recently accessed will remain listed here while their consent window is active."
            showPlant={false}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Patient Name</Th>
                <Th>Last Accessed</Th>
                <Th>Window Remaining</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.map((patient) => (
                <Tr key={`${patient.patient_id}-${patient.token}`}>
                  <Td className="font-semibold text-ink">{patient.patient_name}</Td>
                  <Td className="font-mono text-xs tabular-nums text-secondary">
                    {formatDateTime(patient.last_accessed_at)}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-forest font-semibold text-xs font-mono">
                      <LuClock className="size-3.5 text-leaf" />
                      <CountdownText
                        expiresAt={patient.access_ends_at}
                        onExpire={() => queryClient.invalidateQueries({ queryKey: ["doctor-recent"] })}
                      />
                    </div>
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openPatient(patient.patient_id, patient.token, patient.access_ends_at)}
                      className="gap-1.5 text-xs h-7.5"
                    >
                      <LuExternalLink className="size-3 text-forest" />
                      <span>Open Record</span>
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <ScannerModal open={scanOpen} onClose={() => setScanOpen(false)} onScan={handleScan} />
    </div>
  );
}
