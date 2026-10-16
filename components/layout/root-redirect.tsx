"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";

export function roleHome(role: string): string {
  return role === "patient" ? "/patient/timeline" : "/doctor/find";
}

export function RootRedirect() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !user) {
      router.replace("/login");
      return;
    }
    router.replace(user.role === "patient" ? "/patient/timeline" : "/doctor/find");
  }, [status, user, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app">
      <p className="text-sm text-muted">Redirecting to your workspace.</p>
    </div>
  );
}
