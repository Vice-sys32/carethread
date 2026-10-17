"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LuKeyRound, LuShieldCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { USE_MOCKS } from "@/lib/api/config";
import { CareThreadLogo } from "@/components/ui/botanical-icons";

function AuthTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-[6px] py-2 text-center text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/25 select-none",
        active
          ? "border border-line-strong bg-surface text-forest font-semibold shadow-subtle"
          : "border border-transparent text-secondary hover:text-ink hover:bg-mint/40",
      )}
    >
      {label}
    </Link>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRegister = pathname === "/register";

  return (
    <div className={cn("w-full transition-all duration-200", isRegister ? "max-w-[500px]" : "max-w-[440px]")}>
      <div className="rounded-card border border-line bg-surface p-6 sm:p-8 shadow-card">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <CareThreadLogo size={48} className="mb-3" />
          <h1 className="text-2xl font-bold tracking-tight text-ink">CareThread</h1>
          <p className="mt-1.5 text-xs sm:text-sm text-secondary max-w-sm leading-relaxed">
            Unified medical history across healthcare providers, shared only with your time-limited consent.
          </p>
        </div>

        {/* Tab Navigator */}
        <nav
          aria-label="Authentication mode"
          className="mt-6 grid grid-cols-2 gap-1 rounded-input border border-line bg-app p-1"
        >
          <AuthTab href="/login" label="Sign in" active={pathname === "/login"} />
          <AuthTab href="/register" label="Create account" active={isRegister} />
        </nav>

        {/* Form Body */}
        <div className="mt-6">{children}</div>

        {/* Security & Consent Footer Badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted border-t border-line/60 pt-4">
          <LuShieldCheck aria-hidden className="size-3.5 text-leaf" />
          <span>Patient-controlled access & time-limited permissions</span>
        </div>
      </div>

      {/* Demo Credentials Box */}
      {USE_MOCKS ? (
        <div className="mt-4 rounded-card border border-line bg-surface/90 p-4 shadow-subtle backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-forest">
            <LuKeyRound aria-hidden className="size-3.5" />
            <span>Demo credentials (mock mode)</span>
          </div>
          <div className="mt-2 flex flex-col gap-1.5 text-xs text-secondary">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded bg-app px-2.5 py-1.5 border border-line/50">
              <span className="font-medium text-ink">Patient:</span>
              <span className="font-mono text-[11px] text-forest-dark select-all">ananya.sharma@example.com / Patient@123</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded bg-app px-2.5 py-1.5 border border-line/50">
              <span className="font-medium text-ink">Doctor:</span>
              <span className="font-mono text-[11px] text-forest-dark select-all">kavita.rao@example.com / Doctor@123</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
