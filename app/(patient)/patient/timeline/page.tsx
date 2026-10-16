import type { Metadata } from "next";
import { TimelineView } from "@/components/records/timeline-view";

export const metadata: Metadata = { title: "Medical history" };

export default function TimelinePage() {
  return <TimelineView />;
}
