import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-[#F4FAF3] via-[#EDF7EF] to-[#FFFDF5] px-4 py-10 sm:py-14 overflow-x-hidden">
      {/* Decorative ambient botanical glows */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-mint/50 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-leaf-fresh/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}
