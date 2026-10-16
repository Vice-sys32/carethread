import type { Metadata } from "next";
import { EmergencyView } from "@/components/records/emergency-view";

export const metadata: Metadata = { title: "Emergency card" };

export default function EmergencyPage() {
  return <EmergencyView />;
}
