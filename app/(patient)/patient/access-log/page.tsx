import type { Metadata } from "next";
import { AccessLogView } from "@/components/records/access-log-view";

export const metadata: Metadata = { title: "Access log" };

export default function AccessLogPage() {
  return <AccessLogView />;
}
