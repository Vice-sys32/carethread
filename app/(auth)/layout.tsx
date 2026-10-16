import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh flex-col items-center justify-center bg-app px-4 py-10">{children}</div>;
}
