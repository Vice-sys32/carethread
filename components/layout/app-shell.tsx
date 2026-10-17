"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/provider";
import { cn } from "@/lib/utils";
import { PAGE_TITLES } from "./nav";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { Drawer } from "@/components/ui/drawer";

function ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-app">
      <div className="hidden w-64 border-r border-line bg-surface md:block fixed inset-y-0" />
      <div className="flex flex-col md:pl-64">
        <div className="flex h-16 items-center border-b border-line bg-surface px-4 md:px-6">
          <Skeleton className="h-5 w-44" />
        </div>
        <div className="px-4 py-6 md:px-6">
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}

interface AppShellProps {
  role: "patient" | "doctor";
  children: ReactNode;
}

export function AppShell({ role, children }: AppShellProps) {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  useEffect(() => {
    if (status === "authenticated" && user && user.role !== role) {
      router.replace(user.role === "patient" ? "/patient/timeline" : "/doctor/find");
    }
  }, [status, user, role, router]);

  const closeMobileNav = useCallback(() => setMobileOpen(false), []);

  if (status !== "authenticated" || !user || user.role !== role) {
    return <ShellSkeleton />;
  }

  const title = pathname.startsWith("/doctor/patient/")
    ? "Patient record"
    : (PAGE_TITLES[pathname] ?? "CareThread");

  return (
    <div className="min-h-dvh bg-app print:bg-white">
      <Sidebar role={role} onLogout={logout} onNavigate={closeMobileNav} />
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Menu"
        side="left"
        width="md"
      >
        <div className="-mx-6 -my-5 h-[calc(100%+2.5rem)] w-64">
          <Sidebar role={role} onLogout={logout} fixed={false} onNavigate={closeMobileNav} className="border-r-0" />
        </div>
      </Drawer>
      <div className="flex min-h-dvh flex-col md:pl-64">
        <TopBar title={title} userName={user.name} role={user.role} onMenu={() => setMobileOpen(true)} onLogout={logout} />
        <main
          className={cn(
            "mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 pb-16 md:px-6 print:max-w-none print:p-0",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
