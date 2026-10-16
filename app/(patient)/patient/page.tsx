import { redirect } from "next/navigation";

export default function PatientIndexPage() {
  redirect("/patient/timeline");
}
