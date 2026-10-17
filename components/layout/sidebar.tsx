"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuLogOut, LuShieldCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { PATIENT_NAV, DOCTOR_NAV, type NavItem } from "./nav";
import { CareThreadLogo } from "@/components/ui/botanical-icons";
import type { Role } from "@/types";

interface SidebarProps {
  role: Role;
  onLogout: () => void;
  fixed?: boolean;
  /** Called when a nav link is clicked; used to close the mobile drawer. */
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ role, onLogout, fixed = true, onNavigate, className }: SidebarProps) {
  const pathname = usePathname();
  const nav: NavItem[] = role === "patient" ? PATIENT_NAV : DOCTOR_NAV;

  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col bg-surface border-r border-line",
        fixed ? "fixed inset-y-0 left-0 z-30 hidden md:flex" : "h-full",
        className,
      )}
    >
      {/* Brand Header */}
      <div className="border-b border-line px-5 py-4.5 bg-surface">
        <Link href={role === "patient" ? "/patient/timeline" : "/doctor/find"} className="flex items-center gap-2.5 group">
          <CareThreadLogo size={34} />
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight tracking-tight text-ink group-hover:text-forest transition-colors">
              CareThread
            </span>
            <span className="text-[11px] font-medium leading-none text-muted">
              {role === "patient" ? "Patient Portal" : "Clinical Portal"}
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted/80">
          Navigation
        </p>
        <ul className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-input px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/25",
                    active
                      ? "bg-mint text-forest font-semibold shadow-subtle border border-leaf/20"
                      : "text-secondary hover:bg-mint/35 hover:text-forest-dark",
                  )}
                >
                  <item.icon
                    aria-hidden
                    className={cn(
                      "size-4.5 shrink-0 transition-colors",
                      active ? "text-forest" : "text-muted group-hover:text-forest",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {active ? (
                    <span className="ml-auto size-1.5 rounded-full bg-forest shrink-0" aria-hidden="true" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Privacy Assurance & Logout Footer */}
      <div className="border-t border-line p-3 bg-app/30 flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-input bg-mint/50 px-3 py-2 text-[11px] font-medium text-forest-dark border border-leaf/15">
          <LuShieldCheck aria-hidden className="size-4 shrink-0 text-leaf" />
          <span>Patient-Consent Secured</span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-input px-3 py-2 text-sm font-medium text-secondary transition-all duration-150 hover:bg-danger-tint hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25"
        >
          <LuLogOut aria-hidden className="size-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
