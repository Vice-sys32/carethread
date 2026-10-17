"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/provider";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { saveConsent } from "@/lib/auth/consent";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LeafSpinner } from "@/components/ui/botanical-icons";

export function AccessLandingView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { status, user } = useAuth();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = encodeURIComponent(pathname + window.location.search);
      router.replace(`/login?next=${next}`);
    }
  }, [status, pathname, router]);

  useEffect(() => {
    if (status !== "authenticated" || !user || user.role !== "doctor") return;
    if (!token) return;
    if (attemptedRef.current) return;
    attemptedRef.current = true;
    setPending(true);
    api.doctor
      .access({ token })
      .then((result) => {
        saveConsent({ token, expiresAt: result.expires_at });
        queryClient.setQueryData(["doctor-access", result.patient_id], result);
        router.replace(`/doctor/patient/${result.patient_id}`);
      })
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "Access denied: this link has expired or was revoked.");
      })
      .finally(() => setPending(false));
  }, [status, user, token, router, queryClient]);

  if (!token) {
    return (
      <EmptyState
        title="Incomplete Access Link"
        description="The access link does not contain a valid security token. Ask the patient for a new QR code or share link."
        showPlant={false}
        action={
          <Button variant="secondary" size="sm" onClick={() => router.push("/doctor/find")}>
            Go to Find Patient
          </Button>
        }
      />
    );
  }

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-lg shadow-card">
        <CardBody className="p-6">
          <ErrorState message={error} />
          <div className="mt-5 flex justify-center">
            <Button variant="secondary" size="sm" onClick={() => router.push("/doctor/find")}>
              Back to Find Patient
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <LeafSpinner size={32} />
      <p className="text-sm font-medium text-forest-dark">
        {pending ? "Opening verified patient record..." : "Validating patient consent token..."}
      </p>
      <p className="text-xs text-muted">Establishing secure read-only consultation window</p>
    </div>
  );
}
