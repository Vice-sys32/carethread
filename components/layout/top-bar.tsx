"use client";

import { LuLogOut, LuMenu } from "react-icons/lu";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  userName: string;
  role: string;
  onMenu: () => void;
  onLogout: () => void;
}

export function TopBar({ title, userName, role, onMenu, onLogout }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenu}
          className="-ml-1 rounded p-1 text-secondary transition-colors duration-150 hover:bg-app hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
        >
          <LuMenu aria-hidden className="size-5" />
        </button>
        <h1 className="truncate text-xl font-semibold text-ink">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-[13px] font-medium leading-4 text-ink">{userName}</p>
          <p className="text-xs capitalize leading-4 text-muted">{role}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LuLogOut aria-hidden className="size-4" />
          Log out
        </Button>
      </div>
    </header>
  );
}
