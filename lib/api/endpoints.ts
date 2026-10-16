import type {
  AccessLogEntry,
  AccessLogQuery,
  DoctorAccessResponse,
  ExtractionResult,
  LoginPayload,
  MedicalRecord,
  Medication,
  PatientProfile,
  RecordQuery,
  RecentPatient,
  RegisterPayload,
  ShareToken,
  User,
  VisitPayload,
} from "@/types";
import { USE_MOCKS } from "./config";
import { request } from "./client";
import { ApiError } from "./errors";
import { mockRequest } from "./mock/adapter";

export interface ApiClient {
  auth: {
    register(body: RegisterPayload): Promise<User>;
    login(body: LoginPayload): Promise<User>;
    me(): Promise<User | null>;
    logout(): Promise<void>;
  };
  patient: {
    getRecords(query?: RecordQuery): Promise<MedicalRecord[]>;
    getMedications(): Promise<Medication[]>;
    uploadRecord(formData: FormData): Promise<MedicalRecord>;
    getFile(recordId: string): Promise<Blob>;
    extract(formData: FormData): Promise<ExtractionResult>;
    getProfile(): Promise<PatientProfile>;
    updateProfile(body: Partial<PatientProfile>): Promise<PatientProfile>;
    createShareToken(body: { duration_minutes: number }): Promise<ShareToken>;
    listShareTokens(): Promise<ShareToken[]>;
    revokeShareToken(id: string): Promise<ShareToken>;
    getAccessLog(query?: AccessLogQuery): Promise<AccessLogEntry[]>;
  };
  doctor: {
    access(body: { token: string }): Promise<DoctorAccessResponse>;
    getPatientRecords(patientId: string, consentToken: string): Promise<MedicalRecord[]>;
    getPatientMedications(patientId: string, consentToken: string): Promise<Medication[]>;
    addVisit(patientId: string, consentToken: string, payload: VisitPayload | FormData): Promise<MedicalRecord>;
    getRecent(): Promise<RecentPatient[]>;
  };
}

async function nullOn401(promise: Promise<User>): Promise<User | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

function consentHeaders(consentToken: string): Record<string, string> {
  return { "X-Consent-Token": consentToken };
}

const fetchClient: ApiClient = {
  auth: {
    register: (body) => request("POST", "/api/auth/register", { body }),
    login: (body) => request("POST", "/api/auth/login", { body }),
    me: () => nullOn401(request("GET", "/api/auth/me")),
    logout: async () => {
      await request("POST", "/api/auth/logout");
    },
  },
  patient: {
    getRecords: (query) =>
      request("GET", "/api/patient/records", {
        query: { type: query?.type, hospital: query?.hospital, from: query?.from, to: query?.to, q: query?.q },
      }),
    getMedications: () => request("GET", "/api/patient/medications"),
    uploadRecord: (formData) => request("POST", "/api/patient/records/upload", { formData }),
    getFile: (recordId) => request("GET", `/api/patient/files/${recordId}`, { responseType: "blob" }),
    extract: (formData) => request("POST", "/api/patient/extract", { formData }),
    getProfile: () => request("GET", "/api/patient/profile"),
    updateProfile: (body) => request("PUT", "/api/patient/profile", { body }),
    createShareToken: (body) => request("POST", "/api/patient/share", { body }),
    listShareTokens: () => request("GET", "/api/patient/share"),
    revokeShareToken: (id) => request("POST", `/api/patient/share/${id}/revoke`),
    getAccessLog: (query) =>
      request("GET", "/api/patient/access-log", { query: { result: query?.result, from: query?.from, to: query?.to } }),
  },
  doctor: {
    access: (body) => request("POST", "/api/doctor/access", { body }),
    getPatientRecords: (patientId, consentToken) =>
      request("GET", `/api/doctor/patient/${patientId}/records`, { headers: consentHeaders(consentToken) }),
    getPatientMedications: (patientId, consentToken) =>
      request("GET", `/api/doctor/patient/${patientId}/medications`, { headers: consentHeaders(consentToken) }),
    addVisit: (patientId, consentToken, payload) =>
      request("POST", `/api/doctor/patient/${patientId}/visits`, {
        ...(payload instanceof FormData ? { formData: payload } : { body: payload }),
        headers: consentHeaders(consentToken),
      }),
    getRecent: () => request("GET", "/api/doctor/recent"),
  },
};

const mockClient: ApiClient = {
  auth: {
    register: (body) => mockRequest("POST", "/api/auth/register", { body }),
    login: (body) => mockRequest("POST", "/api/auth/login", { body }),
    me: () => nullOn401(mockRequest<User>("GET", "/api/auth/me")),
    logout: async () => {
      await mockRequest("POST", "/api/auth/logout");
    },
  },
  patient: {
    getRecords: (query) =>
      mockRequest("GET", "/api/patient/records", {
        query: { type: query?.type, hospital: query?.hospital, from: query?.from, to: query?.to, q: query?.q },
      }),
    getMedications: () => mockRequest("GET", "/api/patient/medications"),
    uploadRecord: (formData) => mockRequest("POST", "/api/patient/records/upload", { formData }),
    getFile: async (recordId) => mockRequest<Blob>("GET", `/api/patient/files/${recordId}`),
    extract: (formData) => mockRequest("POST", "/api/patient/extract", { formData }),
    getProfile: () => mockRequest("GET", "/api/patient/profile"),
    updateProfile: (body) => mockRequest("PUT", "/api/patient/profile", { body }),
    createShareToken: (body) => mockRequest("POST", "/api/patient/share", { body }),
    listShareTokens: () => mockRequest("GET", "/api/patient/share"),
    revokeShareToken: (id) => mockRequest("POST", `/api/patient/share/${id}/revoke`),
    getAccessLog: (query) =>
      mockRequest("GET", "/api/patient/access-log", { query: { result: query?.result, from: query?.from, to: query?.to } }),
  },
  doctor: {
    access: (body) => mockRequest("POST", "/api/doctor/access", { body }),
    getPatientRecords: (patientId, consentToken) =>
      mockRequest("GET", `/api/doctor/patient/${patientId}/records`, { headers: consentHeaders(consentToken) }),
    getPatientMedications: (patientId, consentToken) =>
      mockRequest("GET", `/api/doctor/patient/${patientId}/medications`, { headers: consentHeaders(consentToken) }),
    addVisit: (patientId, consentToken, payload) =>
      mockRequest("POST", `/api/doctor/patient/${patientId}/visits`, {
        ...(payload instanceof FormData ? { formData: payload } : { body: payload }),
        headers: consentHeaders(consentToken),
      }),
    getRecent: () => mockRequest("GET", "/api/doctor/recent"),
  },
};

export const api: ApiClient = USE_MOCKS ? mockClient : fetchClient;
