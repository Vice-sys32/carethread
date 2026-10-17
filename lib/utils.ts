import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(iso)}, ${hh}:${mm}`;
}

export function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, age);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}

/** Extracts a raw token from a pasted value that may be a full share link. */
export function tokenFromInput(input: string): string {
  const value = input.trim();
  try {
    const url = new URL(value);
    const token = url.searchParams.get("token");
    if (token) return token.trim();
  } catch {
    // Not a URL; treat the input as a raw token.
  }
  return value;
}

export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const SPECIALTIES = [
  "Cardiology",
  "General Medicine",
  "Endocrinology",
  "Orthopaedics",
  "Paediatrics",
  "Dermatology",
  "Pulmonology",
  "Obstetrics and Gynaecology",
  "Neurology",
  "Radiology",
] as const;

export const RECORD_TYPE_LABELS: Record<string, string> = {
  visit: "Visit",
  prescription: "Prescription",
  lab_report: "Lab report",
  vaccine: "Vaccine",
  imaging: "Imaging",
  other: "Other",
};

export const SOURCE_LABELS: Record<string, string> = {
  doctor_entry: "Doctor entry",
  uploaded: "Uploaded",
  extracted: "Extracted",
};

export const ACTION_LABELS: Record<string, string> = {
  opened_link: "Opened link",
  viewed_records: "Viewed records",
  added_visit: "Added visit",
  access_denied: "Access denied",
};
