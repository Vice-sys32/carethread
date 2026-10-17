import type { Metadata } from "next";
import { ShareView } from "@/components/share/share-view";

export const metadata: Metadata = { title: "Share access" };

export default function SharePage() {
  return <ShareView />;
}
