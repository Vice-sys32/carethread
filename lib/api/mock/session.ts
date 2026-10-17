import type { Role } from "@/types";

const COOKIE_NAME = "hc_session";

export interface MockSession {
  userId: string;
  role: Role;
}

/** Mock sessions live in a readable cookie so the Next.js proxy can route by role. */
export function setMockSession(session: MockSession) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=604800; samesite=lax`;
}

export function clearMockSession() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function getMockSession(): MockSession | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.slice(COOKIE_NAME.length + 1))) as MockSession;
    return parsed?.userId && parsed?.role ? parsed : null;
  } catch {
    return null;
  }
}
