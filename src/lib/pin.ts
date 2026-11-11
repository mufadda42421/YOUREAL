// ─── Four-digit PIN utilities ────────────────────────────────────────────────
// PBKDF2-SHA256 · per-user salt · verifier only, never the PIN itself.
// This is a privacy layer for shared devices, not a replacement for Firebase Auth.

const ITERATIONS = 120_000;
const KEY_LEN_BITS = 256;

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

async function deriveBits(pin: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    KEY_LEN_BITS
  );
}

export async function createPinVerifier(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(pin, salt, ITERATIONS);
  return {
    enabled: true as const,
    iterations: ITERATIONS,
    salt: toHex(salt),
    hash: toHex(bits),
    updatedAt: new Date().toISOString(),
  };
}

export async function verifyPin(
  pin: string,
  verifier: { iterations: number; salt: string; hash: string }
): Promise<boolean> {
  if (!/^\d{4}$/.test(pin)) return false;
  try {
    const salt = fromHex(verifier.salt);
    const bits = await deriveBits(pin, salt, verifier.iterations);
    return toHex(bits) === verifier.hash;
  } catch {
    return false;
  }
}

// ─── Rate limiting + temporary lockout (device-local, per account) ───────────

const attemptsKey = (uid: string) => `you_pin_attempts_${uid}`;
const LOCK_SCHEDULE: Array<{ fails: number; lockMs: number }> = [
  { fails: 5, lockMs: 30_000 },
  { fails: 8, lockMs: 120_000 },
  { fails: 11, lockMs: 600_000 },
];

export interface PinRateState {
  fails: number;
  lockUntil: number;
}

export function getPinRateState(uid: string): PinRateState {
  try {
    const raw = localStorage.getItem(attemptsKey(uid));
    if (!raw) return { fails: 0, lockUntil: 0 };
    const parsed = JSON.parse(raw) as PinRateState;
    return {
      fails: Number(parsed.fails) || 0,
      lockUntil: Number(parsed.lockUntil) || 0,
    };
  } catch {
    return { fails: 0, lockUntil: 0 };
  }
}

export function recordPinFailure(uid: string): PinRateState {
  const state = getPinRateState(uid);
  const fails = state.fails + 1;
  let lockUntil = 0;
  for (const tier of LOCK_SCHEDULE) {
    if (fails >= tier.fails) lockUntil = Date.now() + tier.lockMs;
  }
  const next = { fails, lockUntil };
  try {
    localStorage.setItem(attemptsKey(uid), JSON.stringify(next));
  } catch {
    /* storage full — ignore */
  }
  return next;
}

export function resetPinAttempts(uid: string) {
  try {
    localStorage.removeItem(attemptsKey(uid));
  } catch {
    /* ignore */
  }
}
