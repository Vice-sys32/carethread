import { redirect } from "next/navigation";

export default function DoctorIndexPage() {
  redirect("/doctor/find");
}
