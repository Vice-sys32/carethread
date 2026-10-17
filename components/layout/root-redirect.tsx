"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/provider";
import { CareThreadLogo, LeafSpinner } from "@/components/ui/botanical-icons";

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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-app gap-4 select-none">
      <CareThreadLogo size={44} showText textClassName="text-lg" />
      <div className="flex items-center gap-2 text-xs text-muted">
        <LeafSpinner size={16} />
        <span>Loading CareThread workspace...</span>
      </div>
    </div>
  );
}
