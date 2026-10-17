import { seedDb, type MockDb } from "./seed";

const STORAGE_KEY = "hc_mock_db_v1";
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

interface PersistedState extends MockDb {
  savedAt: string;
}

/** Loads the mock database from localStorage, or seeds a fresh one. */
export function loadDb(): MockDb {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (Date.now() - new Date(parsed.savedAt).getTime() < MAX_AGE_MS) {
        return parsed;
      }
    }
  } catch {
    // Corrupted or stale store; fall through to a fresh seed.
  }
  return seedDb();
}

/**
 * Persists the mock database (minus file blobs, which are not serializable;
 * downloads fall back to placeholders) so tokens and log entries survive
 * reloads and are shared across browser tabs.
 */
export function persistDb(db: MockDb) {
  try {
    const { files: _files, ...rest } = db as MockDb & { files?: unknown };
    const state: PersistedState = { ...rest, savedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable or full; the mock keeps working in memory.
  }
}
