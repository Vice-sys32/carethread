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
        title="This link is incomplete."
        description="Ask the patient for a new access code, then open it again."
        action={
          <Button variant="secondary" size="sm" onClick={() => router.push("/doctor/find")}>
            Go to Find patient
          </Button>
        }
      />
    );
  }

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardBody>
          <ErrorState message={error} />
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" size="sm" onClick={() => router.push("/doctor/find")}>
              Back to Find patient
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-muted">{pending ? "Opening the shared record." : "Checking the access code."}</p>
    </div>
  );
}
