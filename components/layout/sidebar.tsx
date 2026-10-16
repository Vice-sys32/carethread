"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuLogOut } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { PATIENT_NAV, DOCTOR_NAV, type NavItem } from "./nav";
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
        "flex w-60 shrink-0 flex-col bg-surface",
        fixed ? "fixed inset-y-0 left-0 z-30 hidden border-r border-line md:flex" : "h-full border-r border-line",
        className,
      )}
    >
      <div className="border-b border-line px-5 py-4">
        <p className="text-[15px] font-semibold text-ink">Continuity</p>
        <p className="text-xs text-muted">Medical records</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Main">
        <ul className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-input px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    active ? "bg-accent-tint text-accent-strong" : "text-secondary hover:bg-app hover:text-ink",
                  )}
                >
                  <item.icon aria-hidden className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-input px-3 py-2 text-sm font-medium text-secondary transition-colors duration-150 hover:bg-app hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <LuLogOut aria-hidden className="size-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
