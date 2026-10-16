import type { Metadata } from "next";
import { FindView } from "@/components/doctor/find-view";

export const metadata: Metadata = { title: "Find patient" };

export default function FindPage() {
  return <FindView />;
}
