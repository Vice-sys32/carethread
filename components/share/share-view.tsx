"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { LuQrCode } from "react-icons/lu";
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
      toast("Access code revoked.");
      await queryClient.invalidateQueries({ queryKey: ["share-tokens"] });
    },
    onError: (error) => {
      setRevokeTarget(null);
      toast(error instanceof ApiError ? error.message : "Could not revoke the access code.", "danger");
    },
  });

  const tokenList = tokens.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Create access"
            description="The code gives read-only access to the full history until it expires."
          />
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-secondary">Valid for</span>
              <Segmented
                ariaLabel="Access duration"
                value={duration}
                onChange={setDuration}
                options={DURATIONS}
              />
            </div>
            <Button loading={create.isPending} onClick={() => create.mutate()}>
              <LuQrCode aria-hidden className="size-4" />
              Generate access code
            </Button>
          </CardBody>
        </Card>

        {active ? (
          <Card>
            <CardHeader title="Share this code" description="A doctor can scan the code or open the link." />
            <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="shrink-0 rounded-card border border-line bg-surface p-3">
                <QRCodeSVG value={active.share_url} size={148} marginSize={2} fgColor="#14181f" bgColor="#ffffff" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <Field id="share-link" label="Share link">
                  <Input
                    id="share-link"
                    readOnly
                    value={active.share_url}
                    className="font-mono text-xs"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </Field>
                <CopyButton value={active.share_url} label="Copy link" />
                <p className="text-[13px] text-secondary">
                  Expires at <span className="font-medium text-ink">{formatDateTime(active.expires_at)}</span>
                </p>
                <p className="text-[13px] text-secondary">
                  Time left <CountdownText expiresAt={active.expires_at} onExpire={() => queryClient.invalidateQueries({ queryKey: ["share-tokens"] })} />
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="hidden lg:block">
            <CardBody className="flex h-full items-center justify-center">
              <p className="max-w-xs text-center text-[13px] text-muted">
                Generated codes and QR codes appear here.
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">Access codes</h2>
        {tokens.isPending ? (
          <div className="h-32 animate-pulse rounded-card bg-line/70" />
        ) : tokens.isError ? (
          <ErrorState message="Could not load access codes." onRetry={() => tokens.refetch()} />
        ) : tokenList.length === 0 ? (
          <EmptyState title="No access codes yet." description="Generated codes and their status will be listed here." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Created</Th>
                <Th>Expires</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {tokenList.map((token) => (
                <Tr key={token.id}>
                  <Td className="font-mono text-xs">
                    {token.token.slice(0, 10)}
                    <span className="text-muted">...</span>
                  </Td>
                  <Td className="font-mono text-xs tabular-nums">{formatDateTime(token.created_at)}</Td>
                  <Td className="font-mono text-xs tabular-nums">{formatDateTime(token.expires_at)}</Td>
                  <Td>
                    <Badge tone={statusTone[token.status]} className="capitalize">
                      {token.status}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    {token.status === "active" ? (
                      <Button variant="danger" size="sm" onClick={() => setRevokeTarget(token)}>
                        Revoke
                      </Button>
                    ) : (
                      <span className="text-xs text-muted">No actions</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Modal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke access code"
        description="The doctor will lose access immediately. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setRevokeTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={revoke.isPending} onClick={() => revokeTarget && revoke.mutate(revokeTarget.id)}>
            Revoke code
          </Button>
        </div>
      </Modal>
    </div>
  );
}
