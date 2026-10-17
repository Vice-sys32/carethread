import type {
  AccessAction,
  AccessLogEntry,
  DoctorAccessResponse,
  ExtractionResult,
  MedicalRecord,
  Medication,
  PatientProfile,
  RecordQuery,
  RecentPatient,
  RegisterPayload,
  Role,
  ShareToken,
  User,
  VisitPayload,
} from "@/types";
import { ageFromDob, tokenFromInput, toInputDate } from "@/lib/utils";
import { ApiError } from "../errors";
import { clearMockSession, getMockSession, setMockSession } from "./session";
import { seedDb, type MockDb, type MockUserRow } from "./seed";
import { loadDb, persistDb } from "./storage";

export interface MockRequestOptions {
  body?: unknown;
  query?: Record<string, string | undefined>;
  formData?: FormData;
  headers?: Record<string, string>;
}

interface Db extends MockDb {
  files: Map<string, Blob>;
}

const db: Db = {
  ...(typeof window === "undefined" ? seedDb() : loadDb()),
  files: new Map(),
};
const loggedOnce = new Set<string>();

const delay = () => new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));

function err(status: number, code: string, message: string): never {
  throw new ApiError(status, code, message);
}

function requireSession(role?: Role): MockUserRow {
  const session = getMockSession();
  if (!session) err(401, "UNAUTHENTICATED", "Sign in to continue.");
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) err(401, "UNAUTHENTICATED", "Sign in to continue.");
  if (role && user.role !== role) err(403, "FORBIDDEN", "You do not have access to this resource.");
  return user;
}

function publicUser(user: MockUserRow): User {
  const { id, role, name, email, specialty, hospital_name } = user;
  return role === "doctor" ? { id, role, name, email, specialty, hospital_name } : { id, role, name, email };
}

function tokenStatus(token: ShareToken): ShareToken["status"] {
  if (token.revoked_at) return "revoked";
  return new Date(token.expires_at).getTime() > Date.now() ? "active" : "expired";
}

function withTokenDetails(token: ShareToken): ShareToken {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    ...token,
    status: tokenStatus(token),
    share_url: `${origin}/doctor/access?token=${token.token}`,
  };
}

function sortRecordsDesc(records: MedicalRecord[]): MedicalRecord[] {
  return [...records].sort((a, b) => (a.record_date < b.record_date ? 1 : a.record_date > b.record_date ? -1 : b.created_at.localeCompare(a.created_at)));
}

function logAccess(
  patientId: string,
  doctor: { name: string; hospital_name?: string },
  action: AccessAction,
  allowed: boolean,
  dedupeKey?: string,
) {
  if (dedupeKey) {
    if (loggedOnce.has(dedupeKey)) return;
    loggedOnce.add(dedupeKey);
  }
  const entry: AccessLogEntry = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    patient_id: patientId,
    at: new Date().toISOString(),
    doctor_name: doctor.name,
    hospital_name: doctor.hospital_name ?? "Independent clinic",
    action,
    allowed,
  };
  db.accessLog.push(entry);
}

function requireConsent(patientId: string, doctor: MockUserRow): ShareToken {
  const headerToken = dbHeaderCache["x-consent-token"];
  const match = headerToken ? db.tokens.find((t) => t.token === headerToken) : undefined;
  if (!match || db.tokenOwners[match.id] !== patientId || tokenStatus(match) !== "active") {
    logAccess(patientId, doctor, "access_denied", false);
    err(403, "ACCESS_DENIED", "Access denied: the sharing window has ended or was revoked.");
  }
  return match;
}

// Per-request header cache, set at the top of mockRequest. The adapter handles
// one request at a time in the browser, so a module-level slot is safe.
const dbHeaderCache: Record<string, string> = {};

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function validDate(value: unknown): boolean {
  const s = str(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00`).getTime());
}

function buildExtraction(fileName: string): ExtractionResult {
  const lower = fileName.toLowerCase();
  const today = toInputDate(new Date());
  if (lower.includes("lab") || lower.includes("panel") || lower.includes("profile") || lower.includes("hba1c")) {
    return {
      title: "Laboratory investigation report",
      type: "lab_report",
      hospital_name: "Apollo Hospitals",
      record_date: today,
      doctor_name: "Dr. Kavita Rao",
      diagnosis: "Glycaemic control above target",
      medications: [],
      key_values: [
        { label: "HbA1c", value: "7.6", unit: "%" },
        { label: "Fasting glucose", value: "128", unit: "mg/dL" },
        { label: "Creatinine", value: "0.9", unit: "mg/dL" },
      ],
      confidence: { title: 0.88, type: 0.94, hospital_name: 0.72, record_date: 0.81, doctor_name: 0.64, diagnosis: 0.58 },
      raw_text: "APOLLO HOSPITALS - LABORATORY REPORT\nPatient reference: LH-90211\nHbA1c: 7.6 %\nFasting glucose: 128 mg/dL\nCreatinine: 0.9 mg/dL\nPathologist: Dr. Kavita Rao",
    };
  }
  if (lower.includes("xray") || lower.includes("x-ray") || lower.includes("scan") || lower.includes("imaging")) {
    return {
      title: "Radiology imaging report",
      type: "imaging",
      hospital_name: "Fortis Hospital",
      record_date: today,
      doctor_name: "Dr. Arjun Nair",
      diagnosis: "No acute abnormality",
      medications: [],
      key_values: [{ label: "Modality", value: "X-ray", unit: "" }],
      confidence: { title: 0.86, type: 0.92, hospital_name: 0.77, record_date: 0.74, doctor_name: 0.61, diagnosis: 0.69 },
      raw_text: "FORTIS HOSPITALS - RADIOLOGY\nModality: X-ray\nFindings: No acute abnormality.\nRadiologist: Dr. Arjun Nair",
    };
  }
  if (lower.includes("prescription") || lower.includes("rx")) {
    return {
      title: "Outpatient prescription",
      type: "prescription",
      hospital_name: "Apollo Hospitals",
      record_date: today,
      doctor_name: "Dr. Kavita Rao",
      diagnosis: "Upper respiratory tract infection",
      medications: [
        { name: "Azithromycin", dose: "500 mg", frequency: "Once daily for 3 days" },
        { name: "Paracetamol", dose: "650 mg", frequency: "As needed for fever" },
      ],
      key_values: [],
      confidence: { title: 0.91, type: 0.9, hospital_name: 0.69, record_date: 0.83, doctor_name: 0.72, diagnosis: 0.66 },
      raw_text: "APOLLO HOSPITALS - OPD PRESCRIPTION\nRx: 1. Azithromycin 500 mg OD x 3 days\n2. Paracetamol 650 mg SOS\nAdvised rest and hydration.",
    };
  }
  return {
    title: "Outpatient consultation summary",
    type: "visit",
    hospital_name: "Apollo Hospitals",
    record_date: today,
    doctor_name: "Dr. Kavita Rao",
    diagnosis: "Type 2 diabetes mellitus, on treatment",
    medications: [{ name: "Metformin", dose: "500 mg", frequency: "Twice daily" }],
    key_values: [{ label: "Blood pressure", value: "132/84", unit: "mmHg" }],
    confidence: { title: 0.84, type: 0.88, hospital_name: 0.7, record_date: 0.79, doctor_name: 0.66, diagnosis: 0.63 },
    raw_text: "APOLLO HOSPITALS - CONSULTATION NOTES\nDiagnosis: Type 2 diabetes mellitus, on treatment.\nAdvice: Continue Metformin 500 mg twice daily.\nReview: 3 months.",
  };
}

function parseVisitPayload(patientId: string, options: MockRequestOptions): VisitPayload {
  if (options.formData) {
    const fd = options.formData;
    return {
      visit_date: str(fd.get("visit_date")),
      hospital_name: str(fd.get("hospital_name")),
      diagnosis: str(fd.get("diagnosis")),
      medications: JSON.parse(str(fd.get("medications"), "[]")) as VisitPayload["medications"],
      remarks: str(fd.get("remarks")),
      follow_up_date: str(fd.get("follow_up_date")) || undefined,
    };
  }
  return options.body as VisitPayload;
}

export async function mockRequest<T>(method: string, path: string, options: MockRequestOptions = {}): Promise<T> {
  try {
    return await handleMockRequest<T>(method, path, options);
  } finally {
    if (typeof window !== "undefined") persistDb(db);
  }
}

async function handleMockRequest<T>(method: string, path: string, options: MockRequestOptions = {}): Promise<T> {
  await delay();
  Object.keys(dbHeaderCache).forEach((key) => delete dbHeaderCache[key]);
  for (const [key, value] of Object.entries(options.headers ?? {})) {
    dbHeaderCache[key.toLowerCase()] = value;
  }
  const url = new URL(path, "http://mock.local");
  const p = url.pathname;
  const m = method.toUpperCase();
  const query: Record<string, string | undefined> = { ...options.query };
  if (!query.q) {
    const q = url.searchParams.get("q");
    if (q) query.q = q;
  }

  // ---- Auth ----
  if (m === "POST" && p === "/api/auth/register") {
    const body = options.body as RegisterPayload;
    const email = body.email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      err(422, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
    }
    if (body.password.length < 8 || !/[A-Za-z]/.test(body.password) || !/[0-9]/.test(body.password)) {
      err(422, "WEAK_PASSWORD", "Password must be at least 8 characters with one letter and one number.");
    }
    if (body.role === "patient") {
      if (!validDate(body.date_of_birth)) err(422, "VALIDATION_ERROR", "Enter a valid date of birth.");
      if (!/^\d{10}$/.test(body.phone)) err(422, "VALIDATION_ERROR", "Phone must be a 10 digit number.");
    } else if (!body.license_number.trim() || !body.hospital_name.trim()) {
      err(422, "VALIDATION_ERROR", "Medical license number and hospital name are required.");
    }
    const id = `${body.role === "patient" ? "pt" : "dr"}_${Date.now()}`;
    const user: MockUserRow = body.role === "patient"
      ? { id, role: "patient", name: body.full_name.trim(), email, password: body.password }
      : { id, role: "doctor", name: body.full_name.trim(), email, password: body.password, specialty: body.specialty, hospital_name: body.hospital_name.trim() };
    db.users.push(user);
    if (body.role === "patient") {
      db.patientProfiles[id] = {
        email,
        full_name: body.full_name.trim(),
        date_of_birth: body.date_of_birth,
        phone: body.phone,
        blood_group: body.blood_group,
        allergies: body.allergies.trim(),
        emergency_contact_name: body.emergency_contact_name.trim(),
        emergency_contact_phone: body.emergency_contact_phone,
      };
    } else {
      db.doctorProfiles[id] = {
        email,
        full_name: body.full_name.trim(),
        license_number: body.license_number.trim(),
        specialty: body.specialty,
        hospital_name: body.hospital_name.trim(),
      };
    }
    setMockSession({ userId: id, role: body.role });
    return publicUser(user) as T;
  }

  if (m === "POST" && p === "/api/auth/login") {
    const body = options.body as { email: string; password: string };
    const user = db.users.find((u) => u.email.toLowerCase() === body.email.trim().toLowerCase());
    if (!user || user.password !== body.password) {
      err(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
    }
    setMockSession({ userId: user.id, role: user.role });
    return publicUser(user) as T;
  }

  if (m === "GET" && p === "/api/auth/me") {
    const user = requireSession();
    return publicUser(user) as T;
  }

  if (m === "POST" && p === "/api/auth/logout") {
    clearMockSession();
    return { ok: true } as T;
  }

  // ---- Patient ----
  if (m === "GET" && p === "/api/patient/records") {
    const user = requireSession("patient");
    const q: RecordQuery = {
      type: query.type as RecordQuery["type"],
      hospital: query.hospital,
      from: query.from,
      to: query.to,
      q: query.q,
    };
    const qLower = q.q?.trim().toLowerCase();
    const filtered = db.records.filter((r) => {
      if (r.patient_id !== user.id) return false;
      if (q.type && r.type !== q.type) return false;
      if (q.hospital && r.hospital_name !== q.hospital) return false;
      if (q.from && r.record_date < q.from) return false;
      if (q.to && r.record_date > q.to) return false;
      if (qLower && ![r.title, r.diagnosis, r.remarks, r.doctor_name, r.hospital_name].some((f) => f?.toLowerCase().includes(qLower))) return false;
      return true;
    });
    return sortRecordsDesc(filtered) as T;
  }

  if (m === "GET" && p === "/api/patient/medications") {
    const user = requireSession("patient");
    return db.medications.filter((x) => x.patient_id === user.id) as T;
  }

  if (m === "POST" && p === "/api/patient/records/upload") {
    const user = requireSession("patient");
    const fd = options.formData;
    if (!fd) err(422, "VALIDATION_ERROR", "Upload requires multipart form data.");
    const title = str(fd.get("title")).trim();
    const type = str(fd.get("type"));
    const recordDate = str(fd.get("record_date"));
    if (!title) err(422, "VALIDATION_ERROR", "Title is required.");
    if (!type) err(422, "VALIDATION_ERROR", "Record type is required.");
    if (!validDate(recordDate)) err(422, "VALIDATION_ERROR", "Enter a valid record date.");
    const file = fd.get("file");
    const hasFile = file instanceof File && file.size > 0;
    if (hasFile && file.size > 10 * 1024 * 1024) err(422, "FILE_TOO_LARGE", "File exceeds the 10 MB limit.");
    const id = `rec_${Date.now()}`;
    const record: MedicalRecord = {
      id,
      patient_id: user.id,
      type: type as MedicalRecord["type"],
      title,
      hospital_name: str(fd.get("hospital_name")).trim() || "Not specified",
      doctor_name: str(fd.get("doctor_name")).trim() || "Not specified",
      record_date: recordDate,
      diagnosis: str(fd.get("diagnosis")).trim() || undefined,
      remarks: str(fd.get("remarks")).trim() || undefined,
      source: (str(fd.get("source")) || "uploaded") as MedicalRecord["source"],
      has_file: hasFile,
      file_name: hasFile ? file.name : undefined,
      file_size: hasFile ? file.size : undefined,
      medications: JSON.parse(str(fd.get("medications"), "[]")) as Medication[],
      key_values: JSON.parse(str(fd.get("key_values"), "[]")) as MedicalRecord["key_values"],
      created_at: new Date().toISOString(),
    };
    if (hasFile) db.files.set(id, file);
    db.records.unshift(record);
    return record as T;
  }

  if (m === "GET" && /^\/api\/patient\/files\/[^/]+$/.test(p)) {
    const user = requireSession("patient");
    const recordId = p.split("/").pop() as string;
    const record = db.records.find((r) => r.id === recordId && r.patient_id === user.id);
    if (!record) err(404, "NOT_FOUND", "Record not found.");
    let blob = db.files.get(recordId);
    if (!blob) {
      const text = `CareThread (mock)\nRecord: ${record.title}\nDate: ${record.record_date}\nHospital: ${record.hospital_name}\nDoctor: ${record.doctor_name}\n\n${record.remarks ?? ""}`;
      blob = new Blob([text], { type: "application/pdf" });
      db.files.set(recordId, blob);
    }
    return blob as T;
  }

  if (m === "POST" && p === "/api/patient/extract") {
    const user = requireSession("patient");
    void user;
    const fd = options.formData;
    if (!fd) err(422, "VALIDATION_ERROR", "Extraction requires multipart form data.");
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) err(422, "FILE_REQUIRED", "Attach a file to extract details from.");
    if (file.size > 10 * 1024 * 1024) err(422, "FILE_TOO_LARGE", "File exceeds the 10 MB limit.");
    return buildExtraction(file.name) as T;
  }

  if (m === "GET" && p === "/api/patient/profile") {
    const user = requireSession("patient");
    const profile = db.patientProfiles[user.id];
    if (!profile) err(404, "NOT_FOUND", "Profile not found.");
    return profile as T;
  }

  if (m === "PUT" && p === "/api/patient/profile") {
    const user = requireSession("patient");
    const current = db.patientProfiles[user.id];
    if (!current) err(404, "NOT_FOUND", "Profile not found.");
    const body = options.body as Partial<PatientProfile>;
    const updated: PatientProfile = {
      ...current,
      full_name: str(body.full_name, current.full_name),
      phone: str(body.phone, current.phone),
      date_of_birth: str(body.date_of_birth, current.date_of_birth),
      blood_group: str(body.blood_group, current.blood_group),
      allergies: str(body.allergies, current.allergies),
      emergency_contact_name: str(body.emergency_contact_name, current.emergency_contact_name),
      emergency_contact_phone: str(body.emergency_contact_phone, current.emergency_contact_phone),
    };
    db.patientProfiles[user.id] = updated;
    const dbUser = db.users.find((u) => u.id === user.id);
    if (dbUser) dbUser.name = updated.full_name;
    return updated as T;
  }

  if (m === "POST" && p === "/api/patient/share") {
    const user = requireSession("patient");
    const body = options.body as { duration_minutes: number };
    const duration = Number(body.duration_minutes);
    if (![15, 60, 1440].includes(duration)) err(422, "INVALID_DURATION", "Choose a duration of 15 minutes, 1 hour or 24 hours.");
    const token: ShareToken = {
      id: `tok_${Date.now()}`,
      token: Array.from({ length: 32 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""),
      share_url: "",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + duration * 60_000).toISOString(),
      revoked_at: null,
      status: "active",
    };
    db.tokenOwners[token.id] = user.id;
    db.tokens.unshift(token);
    return withTokenDetails(token) as T;
  }

  if (m === "GET" && p === "/api/patient/share") {
    const user = requireSession("patient");
    const own = db.tokens
      .filter((t) => db.tokenOwners[t.id] === user.id)
      .map(withTokenDetails)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return own as T;
  }

  if (m === "POST" && /^\/api\/patient\/share\/[^/]+\/revoke$/.test(p)) {
    const user = requireSession("patient");
    const id = p.split("/")[4];
    const token = db.tokens.find((t) => t.id === id);
    if (!token || db.tokenOwners[token.id] !== user.id) err(404, "NOT_FOUND", "Access code not found.");
    if (tokenStatus(token) !== "active") err(409, "CONFLICT", "Only active access codes can be revoked.");
    token.revoked_at = new Date().toISOString();
    return withTokenDetails(token) as T;
  }

  if (m === "GET" && p === "/api/patient/access-log") {
    const user = requireSession("patient");
    const result = query.result;
    const from = query.from;
    const to = query.to;
    const filtered = db.accessLog.filter((e) => {
      if (e.patient_id !== user.id) return false;
      if (result === "allowed" && !e.allowed) return false;
      if (result === "denied" && e.allowed) return false;
      const day = e.at.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
    return [...filtered].sort((a, b) => b.at.localeCompare(a.at)) as T;
  }

  // ---- Doctor ----
  if (m === "POST" && p === "/api/doctor/access") {
    const doctor = requireSession("doctor");
    const body = options.body as { token: string };
    const raw = tokenFromInput(str(body.token));
    const token = db.tokens.find((t) => t.token === raw);
    if (!token) err(403, "TOKEN_INVALID", "Access denied: this link is invalid.");
    if (tokenStatus(token) !== "active") {
      logAccess(db.tokenOwners[token.id] ?? "unknown", doctor, "access_denied", false);
      err(403, token.revoked_at ? "TOKEN_REVOKED" : "TOKEN_EXPIRED", "Access denied: this link has expired or was revoked.");
    }
    const patientId = db.tokenOwners[token.id];
    const profile = patientId ? db.patientProfiles[patientId] : undefined;
    if (!patientId || !profile) err(404, "NOT_FOUND", "Patient profile not found.");
    logAccess(patientId, doctor, "opened_link", true, `${token.id}:opened:${doctor.id}`);
    const existing = db.consents.find((c) => c.doctor_id === doctor.id && c.patient_id === patientId && c.token_id === token.id);
    if (existing) {
      existing.last_accessed_at = new Date().toISOString();
    } else {
      db.consents.push({ doctor_id: doctor.id, patient_id: patientId, token_id: token.id, last_accessed_at: new Date().toISOString() });
    }
    const response: DoctorAccessResponse = {
      patient_id: patientId,
      patient_summary: {
        name: profile.full_name,
        age: ageFromDob(profile.date_of_birth),
        blood_group: profile.blood_group,
        allergies: profile.allergies,
      },
      expires_at: token.expires_at,
    };
    return response as T;
  }

  if (m === "GET" && /^\/api\/doctor\/patient\/[^/]+\/records$/.test(p)) {
    const doctor = requireSession("doctor");
    const patientId = p.split("/")[4];
    const token = requireConsent(patientId, doctor);
    logAccess(patientId, doctor, "viewed_records", true, `${token.id}:viewed:${doctor.id}`);
    db.consents.filter((c) => c.doctor_id === doctor.id && c.patient_id === patientId).forEach((c) => {
      c.last_accessed_at = new Date().toISOString();
    });
    return sortRecordsDesc(db.records.filter((r) => r.patient_id === patientId)) as T;
  }

  if (m === "GET" && /^\/api\/doctor\/patient\/[^/]+\/medications$/.test(p)) {
    const doctor = requireSession("doctor");
    const patientId = p.split("/")[4];
    requireConsent(patientId, doctor);
    return db.medications.filter((x) => x.patient_id === patientId) as T;
  }

  if (m === "POST" && /^\/api\/doctor\/patient\/[^/]+\/visits$/.test(p)) {
    const doctor = requireSession("doctor");
    const patientId = p.split("/")[4];
    const token = requireConsent(patientId, doctor);
    const payload = parseVisitPayload(patientId, options);
    if (!validDate(payload.visit_date)) err(422, "VALIDATION_ERROR", "Enter a valid visit date.");
    if (!payload.hospital_name.trim()) err(422, "VALIDATION_ERROR", "Hospital or clinic is required.");
    if (!payload.diagnosis.trim()) err(422, "VALIDATION_ERROR", "Diagnosis is required.");
    const record: MedicalRecord = {
      id: `rec_${Date.now()}`,
      patient_id: patientId,
      type: "visit",
      title: "Consultation visit",
      hospital_name: payload.hospital_name.trim(),
      doctor_name: doctor.name,
      record_date: payload.visit_date,
      diagnosis: payload.diagnosis.trim(),
      remarks: payload.remarks.trim() || undefined,
      source: "doctor_entry",
      has_file: false,
      medications: payload.medications
        .filter((x) => x.name.trim())
        .map((x, i) => ({
          id: `med_link_${Date.now()}_${i}`,
          patient_id: patientId,
          name: x.name.trim(),
          dose: x.dose.trim(),
          frequency: x.frequency.trim(),
          duration: x.duration?.trim() || undefined,
          status: x.status,
          prescribed_by: doctor.name,
          start_date: payload.visit_date,
        })),
      key_values: [],
      created_at: new Date().toISOString(),
    };
    db.records.unshift(record);
    logAccess(patientId, doctor, "added_visit", true, `${token.id}:visit:${record.id}`);
    return record as T;
  }

  if (m === "GET" && p === "/api/doctor/recent") {
    const doctor = requireSession("doctor");
    const recent: RecentPatient[] = db.consents
      .filter((c) => c.doctor_id === doctor.id)
      .map((c) => {
        const token = db.tokens.find((t) => t.id === c.token_id);
        const profile = db.patientProfiles[c.patient_id];
        if (!token || !profile || tokenStatus(token) !== "active") return null;
        return {
          patient_id: c.patient_id,
          patient_name: profile.full_name,
          last_accessed_at: c.last_accessed_at,
          access_ends_at: token.expires_at,
          token: token.token,
        };
      })
      .filter((x): x is RecentPatient => x !== null)
      .sort((a, b) => b.last_accessed_at.localeCompare(a.last_accessed_at));
    return recent as T;
  }

  err(404, "NOT_FOUND", `No mock handler for ${m} ${p}.`);
}
