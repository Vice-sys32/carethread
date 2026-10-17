const CONSENT_KEY = "hc_consent";

export interface ConsentRecord {
  token: string;
  expiresAt: string;
}

export function saveConsent(record: ConsentRecord) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CONSENT_KEY, JSON.stringify(record));
}

export function getConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

export function clearConsent() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CONSENT_KEY);
}
