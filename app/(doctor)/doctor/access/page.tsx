import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessLandingView } from "@/components/doctor/access-landing-view";

export const metadata: Metadata = { title: "Open shared record" };

export default function DoctorAccessPage() {
  return (
    <Suspense>
      <AccessLandingView />
    </Suspense>
  );
}
