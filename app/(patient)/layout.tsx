import { AppShell } from "@/components/layout/app-shell";
import type { ReactNode } from "react";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return <AppShell role="patient">{children}</AppShell>;
}
