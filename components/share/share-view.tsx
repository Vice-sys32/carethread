"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { LuClock, LuLock, LuQrCode, LuShieldCheck, LuSparkles } from "react-icons/lu";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CountdownText } from "@/components/ui/countdown-text";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Field } from "@/components/ui/field";
import type { ShareToken, ShareTokenStatus } from "@/types";

const DURATIONS = [
  { value: "15", label: "15 minutes" },
  { value: "60", label: "1 hour" },
  { value: "1440", label: "24 hours" },
] as const;

type DurationValue = (typeof DURATIONS)[number]["value"];

const statusTone: Record<ShareTokenStatus, "success" | "warning" | "danger"> = {
  active: "success",
  expired: "warning",
  revoked: "danger",
};

export function ShareView() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [duration, setDuration] = useState<DurationValue>("60");
  const [active, setActive] = useState<ShareToken | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ShareToken | null>(null);

  const tokens = useQuery({ queryKey: ["share-tokens"], queryFn: () => api.patient.listShareTokens() });

  const create = useMutation({
    mutationFn: () => api.patient.createShareToken({ duration_minutes: Number(duration) }),
    onSuccess: async (token) => {
      setActive(token);
      toast("Temporary access code generated.");
      await queryClient.invalidateQueries({ queryKey: ["share-tokens"] });
    },
    onError: (error) => {
      toast(error instanceof ApiError ? error.message : "Could not generate an access code.", "danger");
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.patient.revokeShareToken(id),
    onSuccess: async () => {
      setRevokeTarget(null);
      toast("Access code revoked. Access has ended immediately.");
      await queryClient.invalidateQueries({ queryKey: ["share-tokens"] });
      if (active && active.id === revokeTarget?.id) {
        setActive(null);
      }
    },
    onError: (error) => {
      setRevokeTarget(null);
      toast(error instanceof ApiError ? error.message : "Could not revoke the access code.", "danger");
    },
  });

  const tokenList = tokens.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Privacy & Patient Control Banner */}
      <div className="rounded-card border border-leaf/30 bg-gradient-to-r from-mint/50 via-surface to-mint/20 p-5 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-forest border border-leaf/30 shadow-subtle">
              <LuShieldCheck className="size-5 text-leaf" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-forest-dark">
                Consent-Based Doctor Sharing
              </h2>
              <p className="mt-0.5 text-xs text-muted max-w-xl leading-relaxed">
                You control who sees your health records. Each access code grants read-only access for a fixed window. You can revoke permission at any time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-forest self-start sm:self-auto bg-surface px-3 py-1.5 rounded-full border border-line shadow-xs">
            <LuLock className="size-3.5 text-leaf" />
            <span>Encrypted Time-Limited Access</span>
          </div>
        </div>
      </div>

      {/* Creation and Active Code Display Grid */}
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="shadow-card">
          <CardHeader
            title="Create Access Code"
            description="Select how long the doctor can view your timeline."
          />
          <CardBody className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-secondary">Sharing Window Duration</span>
              <Segmented
                ariaLabel="Access duration"
                value={duration}
                onChange={setDuration}
                options={DURATIONS}
              />
              <p className="text-[11px] text-muted">
                {duration === "15" && "Best for a brief clinical check or triage."}
                {duration === "60" && "Standard outpatient doctor consultation."}
                {duration === "1440" && "Recommended for hospital admission or full-day observation."}
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              loading={create.isPending}
              onClick={() => create.mutate()}
              className="gap-2 w-full"
            >
              <LuQrCode aria-hidden className="size-4" />
              <span>Generate Access Code & QR</span>
            </Button>
          </CardBody>
        </Card>

        {active ? (
          <Card className="border-leaf/40 bg-gradient-to-br from-surface to-mint/20 shadow-card">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <LuSparkles className="size-4 text-leaf" />
                  <span>Active Share Token</span>
                </div>
              }
              description="Show this QR code to your doctor, or copy the direct access link."
              actions={
                <Badge tone="success" dot>
                  Active Now
                </Badge>
              }
            />
            <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="rounded-card border-2 border-leaf/40 bg-white p-3 shadow-card">
                  <QRCodeSVG value={active.share_url} size={152} marginSize={2} fgColor="#183B2A" bgColor="#FFFFFF" />
                </div>
                <span className="text-[11px] font-medium text-muted">Scan with doctor device</span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-3.5">
                <Field id="share-link" label="Doctor Direct Link">
                  <Input
                    id="share-link"
                    readOnly
                    value={active.share_url}
                    className="font-mono text-xs bg-app"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </Field>

                <div className="flex items-center gap-2">
                  <CopyButton value={active.share_url} label="Copy access link" />
                </div>

                <div className="rounded-input border border-line bg-surface/80 p-3 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between text-secondary">
                    <span>Valid until:</span>
                    <span className="font-semibold text-ink">{formatDateTime(active.expires_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-secondary">
                    <span className="flex items-center gap-1">
                      <LuClock className="size-3 text-leaf" />
                      <span>Remaining time:</span>
                    </span>
                    <span className="font-semibold text-forest font-mono">
                      <CountdownText
                        expiresAt={active.expires_at}
                        onExpire={() => queryClient.invalidateQueries({ queryKey: ["share-tokens"] })}
                      />
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="hidden lg:flex flex-col items-center justify-center border-dashed p-8 text-center bg-app/30">
            <div className="flex size-14 items-center justify-center rounded-full bg-mint text-forest mb-2">
              <LuQrCode className="size-6 text-leaf" />
            </div>
            <p className="text-sm font-semibold text-forest-dark">No Active Code Generated</p>
            <p className="max-w-xs text-xs text-muted mt-1 leading-relaxed">
              When you generate an access code, the scannable QR code and countdown timer will appear right here.
            </p>
          </Card>
        )}
      </div>

      {/* Access History Table */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-forest-dark">
            Generated Access Codes & Audit
          </h2>
          <span className="text-xs text-muted">
            {tokenList.length} total codes
          </span>
        </div>

        {tokens.isPending ? (
          <div className="h-32 animate-pulse rounded-card bg-line/60" />
        ) : tokens.isError ? (
          <ErrorState message="Could not load your access codes." onRetry={() => tokens.refetch()} />
        ) : tokenList.length === 0 ? (
          <EmptyState
            title="No access codes created yet."
            description="When you generate temporary access for doctor consultations, past codes and their validity status will appear here."
            showPlant={false}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Access Code</Th>
                <Th>Created At</Th>
                <Th>Expires At</Th>
                <Th>Current Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {tokenList.map((token) => (
                <Tr key={token.id}>
                  <Td className="font-mono text-xs font-semibold text-forest-dark">
                    {token.token.slice(0, 10)}
                    <span className="text-muted/70">••••••••</span>
                  </Td>
                  <Td className="font-mono text-xs tabular-nums text-secondary">
                    {formatDateTime(token.created_at)}
                  </Td>
                  <Td className="font-mono text-xs tabular-nums text-secondary">
                    {formatDateTime(token.expires_at)}
                  </Td>
                  <Td>
                    <Badge tone={statusTone[token.status]} dot className="capitalize">
                      {token.status}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    {token.status === "active" ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setRevokeTarget(token)}
                        className="h-7 text-xs px-2.5"
                      >
                        Revoke Access
                      </Button>
                    ) : (
                      <span className="text-xs text-muted font-normal">Closed</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Revocation Confirmation Modal */}
      <Modal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke Access Immediately?"
        description="The doctor will lose access to your medical history right away. This action is recorded in your transparency access log."
      >
        <div className="flex justify-end gap-2.5 mt-2">
          <Button variant="secondary" size="sm" onClick={() => setRevokeTarget(null)}>
            Keep Access Open
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={revoke.isPending}
            onClick={() => revokeTarget && revoke.mutate(revokeTarget.id)}
          >
            Revoke Access Now
          </Button>
        </div>
      </Modal>
    </div>
  );
}
