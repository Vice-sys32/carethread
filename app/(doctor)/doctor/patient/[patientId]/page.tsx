import type { Metadata } from "next";
import { PatientRecordView } from "@/components/doctor/patient-record-view";

export const metadata: Metadata = { title: "Patient record" };

export default async function DoctorPatientPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  return <PatientRecordView patientId={patientId} />;
}
