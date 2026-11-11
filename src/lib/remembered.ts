import { REMEMBERED_KEY, ACTIVE_UID_KEY } from "./utils";
import type { RememberedAccount } from "./types";

/** Device-local identifiers ONLY — never passwords or tokens. */

export function readRemembered(): RememberedAccount[] {
  try {
    const raw = localStorage.getItem(REMEMBERED_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as RememberedAccount[];
    return Array.isArray(list)
      ? list.filter((a) => a && typeof a.uid === "string" && typeof a.email === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeRemembered(list: RememberedAccount[]) {
  try {
    localStorage.setItem(REMEMBERED_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function rememberAccount(entry: RememberedAccount) {
  const list = readRemembered().filter((a) => a.uid !== entry.uid);
  list.unshift({ ...entry, lastUsedAt: Date.now() });
  writeRemembered(list.slice(0, 10));
}

export function updateRemembered(uid: string, patch: Partial<RememberedAccount>) {
  const list = readRemembered().map((a) => (a.uid === uid ? { ...a, ...patch } : a));
  writeRemembered(list);
}

export function forgetAccount(uid: string) {
  writeRemembered(readRemembered().filter((a) => a.uid !== uid));
  const active = localStorage.getItem(ACTIVE_UID_KEY);
  if (active === uid) localStorage.removeItem(ACTIVE_UID_KEY);
}

export function getActiveUid(): string | null {
  try {
    return localStorage.getItem(ACTIVE_UID_KEY);
  } catch {
    return null;
  }
}

export function setActiveUid(uid: string | null) {
  try {
    if (uid) localStorage.setItem(ACTIVE_UID_KEY, uid);
    else localStorage.removeItem(ACTIVE_UID_KEY);
  } catch {
    /* ignore */
  }
}
