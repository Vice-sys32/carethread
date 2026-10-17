"use client";

import { LuLogOut, LuMenu } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  title: string;
  userName: string;
  role: string;
  onMenu: () => void;
  onLogout: () => void;
}

export function TopBar({ title, userName, role, onMenu, onLogout }: TopBarProps) {
  // Extract initials for the botanical avatar badge
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface/95 backdrop-blur-md px-4 md:px-6 shadow-subtle">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenu}
          className="-ml-1 rounded-input p-1.5 text-secondary transition-colors duration-150 hover:bg-mint/40 hover:text-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf/25 md:hidden"
        >
          <LuMenu aria-hidden className="size-5" />
        </button>
        <h1 className="truncate text-lg sm:text-xl font-semibold tracking-tight text-ink">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-3.5">
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-semibold leading-4 text-ink">{userName}</p>
            <div className="mt-0.5 flex justify-end">
              <Badge tone={role === "patient" ? "leaf" : "accent"} className="text-[10px] py-0 px-1.5 capitalize">
                {role}
              </Badge>
            </div>
          </div>
          <div
            className="flex size-9 items-center justify-center rounded-full bg-mint text-forest font-semibold text-xs border border-leaf/30 shadow-subtle select-none"
            aria-hidden="true"
          >
            {initials || "CT"}
          </div>
        </div>

        <div className="h-5 w-px bg-line" aria-hidden="true" />

        <Button variant="ghost" size="sm" onClick={onLogout} className="text-secondary hover:text-danger hover:bg-danger-tint">
          <LuLogOut aria-hidden className="size-4" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
