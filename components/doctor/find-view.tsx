"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuCamera } from "react-icons/lu";
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
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader
          title="Open a shared record"
          description="Scan the QR code shown by the patient, or paste the share link you received."
        />
        <CardBody className="flex flex-col gap-4">
          {access.isError ? (
            <FormBanner
              message={
                access.error instanceof ApiError
                  ? access.error.message
                  : "Access denied: this link has expired or was revoked."
              }
            />
          ) : null}
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              access.mutate(tokenFromInput(tokenInput));
            }}
            noValidate
          >
            <Field id="token" label="Share link or token" required>
              <Input
                id="token"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Paste the link or the 32 character token"
                className="font-mono text-xs"
                autoComplete="off"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={access.isPending} disabled={!tokenInput.trim()}>
                Open record
              </Button>
              <Button variant="secondary" onClick={() => setScanOpen(true)}>
                <LuCamera aria-hidden className="size-4" />
                Scan QR code
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">Recent patients</h2>
        {recent.isPending ? (
          <div className="h-24 animate-pulse rounded-card bg-line/70" />
        ) : recent.isError ? (
          <ErrorState message="Could not load recent patients." onRetry={() => recent.refetch()} />
        ) : recentPatients.length === 0 ? (
          <EmptyState
            title="No patients with an active sharing window."
            description="Patients appear here after you open a valid share link."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Patient</Th>
                <Th>Last accessed</Th>
                <Th>Access ends in</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {recentPatients.map((patient) => (
                <Tr key={`${patient.patient_id}-${patient.token}`}>
                  <Td className="font-medium">{patient.patient_name}</Td>
                  <Td className="font-mono text-xs tabular-nums">{formatDateTime(patient.last_accessed_at)}</Td>
                  <Td>
                    <CountdownText
                      expiresAt={patient.access_ends_at}
                      onExpire={() => queryClient.invalidateQueries({ queryKey: ["doctor-recent"] })}
                    />
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openPatient(patient.patient_id, patient.token, patient.access_ends_at)}
                    >
                      Open
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
