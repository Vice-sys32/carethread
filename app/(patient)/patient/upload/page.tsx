import type { Metadata } from "next";
import { UploadView } from "@/components/records/upload-view";

export const metadata: Metadata = { title: "Upload record" };

export default function UploadPage() {
  return <UploadView />;
}
