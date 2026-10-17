import { AppShell } from "@/components/layout/app-shell";
import type { ReactNode } from "react";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return <AppShell role="doctor">{children}</AppShell>;
}
