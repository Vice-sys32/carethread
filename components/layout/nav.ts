import type { IconType } from "react-icons";
import {
  LuClipboardList,
  LuHeartPulse,
  LuHistory,
  LuQrCode,
  LuSearch,
  LuUpload,
  LuUser,
} from "react-icons/lu";

export interface NavItem {
  href: string;
  label: string;
  icon: IconType;
}

export const PATIENT_NAV: NavItem[] = [
  { href: "/patient/timeline", label: "Medical history", icon: LuHistory },
  { href: "/patient/upload", label: "Upload record", icon: LuUpload },
  { href: "/patient/share", label: "Share access", icon: LuQrCode },
  { href: "/patient/access-log", label: "Access log", icon: LuClipboardList },
  { href: "/patient/emergency", label: "Emergency card", icon: LuHeartPulse },
  { href: "/patient/profile", label: "Profile", icon: LuUser },
];

export const DOCTOR_NAV: NavItem[] = [{ href: "/doctor/find", label: "Find patient", icon: LuSearch }];

export const PAGE_TITLES: Record<string, string> = {
  "/patient/timeline": "Medical history",
  "/patient/upload": "Upload record",
  "/patient/share": "Share access",
  "/patient/access-log": "Access log",
  "/patient/emergency": "Emergency card",
  "/patient/profile": "Profile",
  "/doctor/find": "Find patient",
  "/doctor/access": "Open shared record",
};
