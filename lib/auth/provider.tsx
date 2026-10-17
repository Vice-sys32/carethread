"use client";

import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { setUnauthorizedHandler } from "@/lib/api/errors";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { data, isPending } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.auth.me(),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear();
      if (!pathname.startsWith("/login")) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient, router, pathname]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Session may already be gone; clear local state regardless.
    }
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }, [queryClient]);

  const user = data ?? null;
  const status = isPending ? "loading" : user ? "authenticated" : "unauthenticated";

  return <AuthContext.Provider value={{ user, status, refresh, logout }}>{children}</AuthContext.Provider>;
}
