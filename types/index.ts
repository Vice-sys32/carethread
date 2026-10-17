export type Role = "patient" | "doctor";

export type RecordType =
  | "visit"
  | "prescription"
  | "lab_report"
  | "vaccine"
  | "imaging"
  | "other";

export type RecordSource = "doctor_entry" | "uploaded" | "extracted";

export type MedicationStatus = "current" | "past";

export type ShareTokenStatus = "active" | "expired" | "revoked";

export type AccessAction =
  | "opened_link"
  | "viewed_records"
  | "added_visit"
  | "access_denied";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  /** Present on doctor users; used to prefill the hospital field on visit forms. */
  hospital_name?: string;
  specialty?: string;
}

export interface Medication {
  id: string;
  patient_id: string;
  name: string;
  dose: string;
  frequency: string;
  duration?: string;
  status: MedicationStatus;
  prescribed_by: string;
  start_date: string;
  end_date?: string;
}

export interface KeyValue {
  label: string;
  value: string;
  unit?: string;
}

export interface ExtractedField {
  field: string;
  label: string;
  value: string;
  confidence: number;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  type: RecordType;
  title: string;
  hospital_name: string;
  doctor_name: string;
  record_date: string;
  diagnosis?: string;
  remarks?: string;
  source: RecordSource;
  has_file: boolean;
  file_name?: string;
  file_size?: number;
  medications: Medication[];
  key_values: KeyValue[];
  extracted_fields?: ExtractedField[];
  created_at: string;
}

export interface PatientProfile {
  email: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
  blood_group: string;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

export interface DoctorProfile {
  email: string;
  full_name: string;
  license_number: string;
  specialty: string;
  hospital_name: string;
}

export interface ShareToken {
  id: string;
  token: string;
  share_url: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  status: ShareTokenStatus;
}

export interface AccessLogEntry {
  id: string;
  patient_id: string;
  at: string;
  doctor_name: string;
  hospital_name: string;
  action: AccessAction;
  allowed: boolean;
}

export interface ExtractionMedication {
  name: string;
  dose: string;
  frequency: string;
}

export interface ExtractionResult {
  title: string;
  type: RecordType;
  hospital_name: string;
  record_date: string;
  doctor_name: string;
  diagnosis: string;
  medications: ExtractionMedication[];
  key_values: KeyValue[];
  confidence: Record<string, number>;
  raw_text: string;
}

export interface PatientSummary {
  name: string;
  age: number;
  sex?: string;
  blood_group: string;
  allergies: string;
}

export interface DoctorAccessResponse {
  patient_id: string;
  patient_summary: PatientSummary;
  expires_at: string;
}

export interface RecentPatient {
  patient_id: string;
  patient_name: string;
  last_accessed_at: string;
  access_ends_at: string;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPatientPayload {
  role: "patient";
  full_name: string;
  email: string;
  password: string;
  date_of_birth: string;
  phone: string;
  blood_group: string;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

export interface RegisterDoctorPayload {
  role: "doctor";
  full_name: string;
  email: string;
  password: string;
  license_number: string;
  specialty: string;
  hospital_name: string;
}

export type RegisterPayload = RegisterPatientPayload | RegisterDoctorPayload;

export interface RecordQuery {
  type?: RecordType;
  hospital?: string;
  from?: string;
  to?: string;
  q?: string;
}

export interface AccessLogQuery {
  result?: "allowed" | "denied";
  from?: string;
  to?: string;
}

export interface VisitMedicationInput {
  name: string;
  dose: string;
  frequency: string;
  duration?: string;
  status: MedicationStatus;
}

export interface VisitPayload {
  visit_date: string;
  hospital_name: string;
  diagnosis: string;
  medications: VisitMedicationInput[];
  remarks: string;
  follow_up_date?: string;
}
