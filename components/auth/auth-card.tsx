"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { USE_MOCKS } from "@/lib/api/config";

function AuthTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-[4px] px-3 py-1.5 text-center text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        active ? "border border-line-strong bg-surface text-ink" : "border border-transparent text-secondary hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-card border border-line bg-surface p-6">
        <p className="text-2xl font-semibold leading-7 text-ink">Continuity</p>
        <p className="mt-1 text-sm text-secondary">Unified medical history, shared only with your consent.</p>
        <nav aria-label="Authentication" className="mt-5 grid grid-cols-2 gap-1 rounded-input border border-line bg-app p-0.5">
          <AuthTab href="/login" label="Login" active={pathname === "/login"} />
          <AuthTab href="/register" label="Register" active={pathname === "/register"} />
        </nav>
        <div className="mt-5">{children}</div>
      </div>
      {USE_MOCKS ? (
        <div className="mt-4 rounded-card border border-line bg-surface p-3">
          <p className="text-xs font-medium text-ink">Demo accounts</p>
          <div className="mt-1 flex flex-col gap-0.5 font-mono text-xs text-secondary">
            <span>ananya.sharma@example.com / Patient@123</span>
            <span>kavita.rao@example.com / Doctor@123</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
