import type {
  AccessLogEntry,
  DoctorProfile,
  MedicalRecord,
  Medication,
  PatientProfile,
  ShareToken,
  User,
} from "@/types";
import { toInputDate } from "@/lib/utils";

export interface MockUserRow extends User {
  password: string;
}

export interface MockDoctorConsent {
  doctor_id: string;
  patient_id: string;
  token_id: string;
  last_accessed_at: string;
}

export interface MockDb {
  users: MockUserRow[];
  patientProfiles: Record<string, PatientProfile>;
  doctorProfiles: Record<string, DoctorProfile>;
  records: MedicalRecord[];
  medications: Medication[];
  tokens: ShareToken[];
  /** Share token id -> patient user id. */
  tokenOwners: Record<string, string>;
  consents: MockDoctorConsent[];
  accessLog: AccessLogEntry[];
}

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const daysAgo = (days: number, hour = 10, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const dateStr = (daysBack: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return toInputDate(d);
};

function med(
  id: string,
  patientId: string,
  name: string,
  dose: string,
  frequency: string,
  status: Medication["status"],
  prescribedBy: string,
  startDaysBack: number,
  endDaysBack?: number,
): Medication {
  return {
    id,
    patient_id: patientId,
    name,
    dose,
    frequency,
    status,
    prescribed_by: prescribedBy,
    start_date: dateStr(startDaysBack),
    ...(endDaysBack !== undefined ? { end_date: dateStr(endDaysBack) } : {}),
  };
}

function inlineMed(m: Medication): Medication {
  return { ...m, id: `${m.id}_link` };
}

const metformin = med("med_1", "pt_1", "Metformin", "500 mg", "Twice daily", "current", "Dr. Kavita Rao", 590);
const telmisartan = med("med_2", "pt_1", "Telmisartan", "40 mg", "Once daily", "current", "Dr. Arjun Nair", 58);
const vitaminD = med("med_3", "pt_1", "Vitamin D3", "60000 IU", "Once weekly", "current", "Dr. Meera Iyer", 320);
const cetirizine = med("med_5", "pt_1", "Cetirizine", "10 mg", "Once daily at night", "past", "Dr. Kavita Rao", 452, 438);
const amlodipine = med("med_6", "pt_2", "Amlodipine", "5 mg", "Once daily", "current", "Dr. Kavita Rao", 34);
const atorvastatin = med("med_7", "pt_2", "Atorvastatin", "10 mg", "Once daily at night", "current", "Dr. Kavita Rao", 34);

function record(r: Omit<MedicalRecord, "created_at">): MedicalRecord {
  return { ...r, created_at: r.record_date };
}

export function seedDb(): MockDb {
  const users: MockUserRow[] = [
    { id: "pt_1", role: "patient", name: "Ananya Sharma", email: "ananya.sharma@example.com", password: "Patient@123" },
    { id: "pt_2", role: "patient", name: "Rohan Mehta", email: "rohan.mehta@example.com", password: "Patient@123" },
    { id: "dr_1", role: "doctor", name: "Dr. Kavita Rao", email: "kavita.rao@example.com", password: "Doctor@123", specialty: "Cardiology", hospital_name: "Apollo Hospitals" },
    { id: "dr_2", role: "doctor", name: "Dr. Arjun Nair", email: "arjun.nair@example.com", password: "Doctor@123", specialty: "General Medicine", hospital_name: "Fortis Hospital" },
    { id: "dr_3", role: "doctor", name: "Dr. Meera Iyer", email: "meera.iyer@example.com", password: "Doctor@123", specialty: "Endocrinology", hospital_name: "Manipal Hospital" },
  ];

  const patientProfiles: Record<string, PatientProfile> = {
    pt_1: {
      email: "ananya.sharma@example.com",
      full_name: "Ananya Sharma",
      date_of_birth: "1991-06-14",
      phone: "9848012345",
      blood_group: "O+",
      allergies: "Penicillin",
      emergency_contact_name: "Vikram Sharma",
      emergency_contact_phone: "9848012346",
    },
    pt_2: {
      email: "rohan.mehta@example.com",
      full_name: "Rohan Mehta",
      date_of_birth: "1985-11-02",
      phone: "9820098765",
      blood_group: "A+",
      allergies: "",
      emergency_contact_name: "Sneha Mehta",
      emergency_contact_phone: "9820098766",
    },
  };

  const doctorProfiles: Record<string, DoctorProfile> = {
    dr_1: { email: "kavita.rao@example.com", full_name: "Dr. Kavita Rao", license_number: "TSMC-48213", specialty: "Cardiology", hospital_name: "Apollo Hospitals" },
    dr_2: { email: "arjun.nair@example.com", full_name: "Dr. Arjun Nair", license_number: "TSMC-51907", specialty: "General Medicine", hospital_name: "Fortis Hospital" },
    dr_3: { email: "meera.iyer@example.com", full_name: "Dr. Meera Iyer", license_number: "TSMC-44772", specialty: "Endocrinology", hospital_name: "Manipal Hospital" },
  };

  const records: MedicalRecord[] = [
    record({ id: "rec_101", patient_id: "pt_1", type: "visit", title: "Type 2 diabetes follow-up", hospital_name: "Apollo Hospitals", doctor_name: "Dr. Kavita Rao", record_date: dateStr(1), diagnosis: "Type 2 diabetes mellitus; blood pressure controlled", remarks: "HbA1c 7.8 percent. Continue Metformin 500 mg twice daily. Diet review with the nutritionist is booked. Next review in three months.", source: "doctor_entry", has_file: false, medications: [inlineMed(metformin)], key_values: [] }),
    record({ id: "rec_102", patient_id: "pt_1", type: "lab_report", title: "HbA1c and fasting glucose panel", hospital_name: "Apollo Hospitals", doctor_name: "Dr. Kavita Rao", record_date: dateStr(2), diagnosis: "Glycaemic control above target", remarks: "Sample collected in the fasting state.", source: "extracted", has_file: true, file_name: "hba1c-panel.pdf", file_size: 184320, medications: [], key_values: [
      { label: "HbA1c", value: "7.8", unit: "%" },
      { label: "Fasting glucose", value: "132", unit: "mg/dL" },
      { label: "Post-prandial glucose", value: "198", unit: "mg/dL" },
    ], extracted_fields: [
      { field: "title", label: "Title", value: "HbA1c and fasting glucose panel", confidence: 0.93 },
      { field: "type", label: "Record type", value: "Lab report", confidence: 0.97 },
      { field: "hospital_name", label: "Hospital or clinic", value: "Apollo Hospitals", confidence: 0.9 },
      { field: "record_date", label: "Date", value: dateStr(2), confidence: 0.88 },
      { field: "doctor_name", label: "Doctor", value: "Dr. Kavita Rao", confidence: 0.68 },
      { field: "diagnosis", label: "Diagnosis", value: "Glycaemic control above target", confidence: 0.74 },
    ] }),
    record({ id: "rec_103", patient_id: "pt_1", type: "visit", title: "Hypertension review", hospital_name: "Fortis Hospital", doctor_name: "Dr. Arjun Nair", record_date: dateStr(58), diagnosis: "Essential hypertension, stage 1", remarks: "Blood pressure 146/94 mmHg. Started Telmisartan 40 mg once daily. Advised salt restriction and a home blood pressure log.", source: "doctor_entry", has_file: false, medications: [inlineMed(telmisartan)], key_values: [] }),
    record({ id: "rec_104", patient_id: "pt_1", type: "prescription", title: "Prescription for hypertension", hospital_name: "Fortis Hospital", doctor_name: "Dr. Arjun Nair", record_date: dateStr(58), source: "uploaded", has_file: true, file_name: "prescription-fortis.pdf", file_size: 98304, medications: [inlineMed(telmisartan)], key_values: [] }),
    record({ id: "rec_105", patient_id: "pt_1", type: "lab_report", title: "Lipid profile", hospital_name: "Manipal Hospital", doctor_name: "Dr. Meera Iyer", record_date: dateStr(127), diagnosis: "Dyslipidaemia", remarks: "Fasting sample. Repeat after three months of dietary change.", source: "extracted", has_file: true, file_name: "lipid-profile.pdf", file_size: 152672, medications: [], key_values: [
      { label: "Total cholesterol", value: "216", unit: "mg/dL" },
      { label: "LDL", value: "148", unit: "mg/dL" },
      { label: "HDL", value: "44", unit: "mg/dL" },
      { label: "Triglycerides", value: "189", unit: "mg/dL" },
    ], extracted_fields: [
      { field: "title", label: "Title", value: "Lipid profile", confidence: 0.95 },
      { field: "type", label: "Record type", value: "Lab report", confidence: 0.96 },
      { field: "hospital_name", label: "Hospital or clinic", value: "Manipal Hospital", confidence: 0.87 },
      { field: "record_date", label: "Date", value: dateStr(127), confidence: 0.82 },
    ] }),
    record({ id: "rec_106", patient_id: "pt_1", type: "vaccine", title: "Influenza vaccine (quadrivalent)", hospital_name: "Manipal Hospital", doctor_name: "Dr. Meera Iyer", record_date: dateStr(194), remarks: "No adverse events during 30 minutes of observation.", source: "doctor_entry", has_file: false, medications: [], key_values: [] }),
    record({ id: "rec_107", patient_id: "pt_1", type: "imaging", title: "Chest X-ray, PA view", hospital_name: "Apollo Hospitals", doctor_name: "Dr. Kavita Rao", record_date: dateStr(216), diagnosis: "Normal study", remarks: "Lung fields clear. Costophrenic angles sharp.", source: "uploaded", has_file: true, file_name: "chest-xray.jpg", file_size: 512000, medications: [], key_values: [] }),
    record({ id: "rec_108", patient_id: "pt_1", type: "other", title: "Discharge summary: dengue fever", hospital_name: "Fortis Hospital", doctor_name: "Dr. Arjun Nair", record_date: dateStr(231), diagnosis: "Dengue fever, recovered", remarks: "Admitted for three days of observation. Platelet count recovered before discharge. Avoid NSAIDs for two weeks.", source: "uploaded", has_file: true, file_name: "discharge-summary.pdf", file_size: 230400, medications: [], key_values: [] }),
    record({ id: "rec_109", patient_id: "pt_1", type: "visit", title: "General consultation: fatigue", hospital_name: "Manipal Hospital", doctor_name: "Dr. Meera Iyer", record_date: dateStr(320), diagnosis: "Vitamin D deficiency", remarks: "Started Vitamin D3 60000 IU weekly for eight weeks, then monthly maintenance.", source: "doctor_entry", has_file: false, medications: [inlineMed(vitaminD)], key_values: [] }),
    record({ id: "rec_110", patient_id: "pt_1", type: "lab_report", title: "Vitamin D and thyroid profile", hospital_name: "Manipal Hospital", doctor_name: "Dr. Meera Iyer", record_date: dateStr(322), source: "uploaded", has_file: true, file_name: "vitamin-d-thyroid.pdf", file_size: 121856, medications: [], key_values: [
      { label: "Vitamin D (25-OH)", value: "14", unit: "ng/mL" },
      { label: "TSH", value: "3.9", unit: "mIU/L" },
      { label: "Free T4", value: "1.2", unit: "ng/dL" },
    ] }),
    record({ id: "rec_111", patient_id: "pt_1", type: "prescription", title: "Prescription for allergic rhinitis", hospital_name: "Apollo Hospitals", doctor_name: "Dr. Kavita Rao", record_date: dateStr(452), source: "uploaded", has_file: true, file_name: "prescription-apollo.pdf", file_size: 88576, medications: [inlineMed(cetirizine)], key_values: [] }),
    record({ id: "rec_112", patient_id: "pt_1", type: "vaccine", title: "Hepatitis B booster", hospital_name: "Apollo Hospitals", doctor_name: "Dr. Kavita Rao", record_date: dateStr(524), remarks: "Schedule complete. Next dose not required.", source: "doctor_entry", has_file: false, medications: [], key_values: [] }),
    record({ id: "rec_113", patient_id: "pt_1", type: "visit", title: "Annual health check", hospital_name: "Apollo Hospitals", doctor_name: "Dr. Kavita Rao", record_date: dateStr(592), diagnosis: "Prediabetes; lifestyle modification advised", remarks: "Fasting glucose 112 mg/dL. Advised 30 minutes of daily activity and a 5 percent weight reduction.", source: "uploaded", has_file: true, file_name: "health-check-2025.pdf", file_size: 274432, medications: [], key_values: [] }),
    record({ id: "rec_201", patient_id: "pt_2", type: "visit", title: "Cardiology consultation", hospital_name: "Apollo Hospitals", doctor_name: "Dr. Kavita Rao", record_date: dateStr(34), diagnosis: "Stage 1 hypertension", remarks: "ECG shows sinus rhythm. Started antihypertensive therapy. Review after four weeks.", source: "doctor_entry", has_file: false, medications: [inlineMed(amlodipine), inlineMed(atorvastatin)], key_values: [] }),
    record({ id: "rec_202", patient_id: "pt_2", type: "lab_report", title: "ECG and lipid profile", hospital_name: "Apollo Hospitals", doctor_name: "Dr. Kavita Rao", record_date: dateStr(36), source: "uploaded", has_file: true, file_name: "ecg-lipid-profile.pdf", file_size: 165888, medications: [], key_values: [
      { label: "Total cholesterol", value: "198", unit: "mg/dL" },
      { label: "LDL", value: "132", unit: "mg/dL" },
      { label: "HDL", value: "40", unit: "mg/dL" },
    ] }),
    record({ id: "rec_203", patient_id: "pt_2", type: "prescription", title: "Prescription for hypertension", hospital_name: "Apollo Hospitals", doctor_name: "Dr. Kavita Rao", record_date: dateStr(34), source: "uploaded", has_file: true, file_name: "prescription-rohan.pdf", file_size: 94208, medications: [inlineMed(amlodipine), inlineMed(atorvastatin)], key_values: [] }),
    record({ id: "rec_204", patient_id: "pt_2", type: "visit", title: "Knee pain follow-up", hospital_name: "Fortis Hospital", doctor_name: "Dr. Arjun Nair", record_date: dateStr(312), diagnosis: "Patellofemoral pain syndrome", remarks: "Physiotherapy for six weeks. Avoid stairs during the acute phase.", source: "doctor_entry", has_file: false, medications: [], key_values: [] }),
    record({ id: "rec_205", patient_id: "pt_2", type: "imaging", title: "Right knee X-ray", hospital_name: "Fortis Hospital", doctor_name: "Dr. Arjun Nair", record_date: dateStr(315), diagnosis: "No fracture; mild joint space narrowing", source: "uploaded", has_file: true, file_name: "knee-xray.jpg", file_size: 498688, medications: [], key_values: [] }),
  ];

  const medications: Medication[] = [
    metformin,
    telmisartan,
    vitaminD,
    med("med_4", "pt_1", "Pantoprazole", "40 mg", "Once daily before food", "past", "Dr. Arjun Nair", 231, 225),
    cetirizine,
    amlodipine,
    atorvastatin,
    med("med_8", "pt_2", "Paracetamol", "650 mg", "As needed", "past", "Dr. Arjun Nair", 312, 298),
  ];

  const tokens: ShareToken[] = [
    { id: "tok_1", token: "8f3a9c2e71b4d6f0a5c8e2b19d4730ab", share_url: "", created_at: minutesAgo(10), expires_at: minutesFromNow(50), revoked_at: null, status: "active" },
    { id: "tok_2", token: "c47b1e9f2a8d3056b7e1f4c9a0d28b3e", share_url: "", created_at: daysAgo(12, 9, 0), expires_at: daysAgo(12, 10, 0), revoked_at: null, status: "expired" },
    { id: "tok_3", token: "91e4b7c3d2f8a6059e3b1c7d4f2a8b60", share_url: "", created_at: daysAgo(2, 17, 45), expires_at: daysAgo(1, 17, 45), revoked_at: daysAgo(2, 18, 5), status: "revoked" },
  ];

  const consents: MockDoctorConsent[] = [
    { doctor_id: "dr_1", patient_id: "pt_1", token_id: "tok_1", last_accessed_at: minutesAgo(5) },
  ];

  const tokenOwners: Record<string, string> = { tok_1: "pt_1", tok_2: "pt_1", tok_3: "pt_1" };

  const accessLog: AccessLogEntry[] = [
    { id: "log_1", patient_id: "pt_1", at: daysAgo(4, 10, 32), doctor_name: "Dr. Kavita Rao", hospital_name: "Apollo Hospitals", action: "opened_link", allowed: true },
    { id: "log_2", patient_id: "pt_1", at: daysAgo(4, 10, 33), doctor_name: "Dr. Kavita Rao", hospital_name: "Apollo Hospitals", action: "viewed_records", allowed: true },
    { id: "log_3", patient_id: "pt_1", at: daysAgo(2, 17, 50), doctor_name: "Dr. Kavita Rao", hospital_name: "Apollo Hospitals", action: "added_visit", allowed: true },
    { id: "log_4", patient_id: "pt_1", at: daysAgo(2, 18, 5), doctor_name: "Dr. Arjun Nair", hospital_name: "Fortis Hospital", action: "access_denied", allowed: false },
    { id: "log_5", patient_id: "pt_2", at: daysAgo(34, 11, 15), doctor_name: "Dr. Kavita Rao", hospital_name: "Apollo Hospitals", action: "opened_link", allowed: true },
    { id: "log_6", patient_id: "pt_2", at: daysAgo(34, 11, 16), doctor_name: "Dr. Kavita Rao", hospital_name: "Apollo Hospitals", action: "viewed_records", allowed: true },
  ];

  return { users, patientProfiles, doctorProfiles, records, medications, tokens, tokenOwners, consents, accessLog };
}
