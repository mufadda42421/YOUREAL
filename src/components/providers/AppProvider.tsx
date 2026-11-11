"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  type User,
} from "firebase/auth";
import {
  getDefaultApp,
  getAccountAuth,
  deleteAccountApp,
  isFirebaseConfigured,
} from "@/lib/firebase/config";
import { createProfile, fetchProfile, getOrCreateProfile, updateProfile } from "@/lib/firebase/profile";
import {
  readRemembered,
  rememberAccount,
  updateRemembered,
  forgetAccount,
  getActiveUid,
  setActiveUid,
} from "@/lib/remembered";
import {
  createPinVerifier,
  verifyPin,
  getPinRateState,
  recordPinFailure,
  resetPinAttempts,
} from "@/lib/pin";
import { authErrorMessage } from "@/lib/validation";
import { THEME_KEY } from "@/lib/utils";
import type { RememberedAccount, UserProfile } from "@/lib/types";

export type AuthStatus = "loading" | "signed-out" | "locked" | "ready" | "error";

interface AuthResult {
  ok: boolean;
  error?: string;
  profile?: UserProfile;
}

interface AppContextValue {
  configured: boolean;
  status: AuthStatus;
  user: User | null;
  profile: UserProfile | null;
  remembered: RememberedAccount[];
  activeUid: string | null;
  pinLockInfo: { lockUntil: number; remainingFails: number } | null;

  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (fullName: string, email: string, password: string) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOutActive: () => Promise<void>;
  /** Switch to another remembered account on this device. */
  switchAccount: (uid: string) => Promise<"ready" | "locked" | "needs-auth">;
  /** Add another account — keeps existing sessions, shows sign-up/sign-in flow. */
  prepareAddAccount: (intent?: "signup" | "signin") => void;
  /** Reads-and-clears the intent set by prepareAddAccount (used by route guard). */
  consumeSwitchIntent: () => "signup" | "signin" | null;
  /** Remove a remembered account and destroy its on-device session. */
  forgetAccountDevice: (uid: string) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<{ ok: boolean; error?: string; lockedForMs?: number }>;
  enablePin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  disablePin: (currentPin: string) => Promise<{ ok: boolean; error?: string }>;
  changePin: (currentPin: string, nextPin: string) => Promise<{ ok: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  applyProfile: (patch: Partial<UserProfile>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

function applyThemeClass(theme: "light" | "dark" | "system") {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

function syncRemembered(profile: UserProfile) {
  updateRemembered(profile.uid, {
    displayName: profile.fullName,
    photoURL: profile.avatarUrl,
    pinEnabled: Boolean(profile.pin?.enabled),
  });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [remembered, setRemembered] = useState<RememberedAccount[]>([]);
  const [activeUid, setActiveUidState] = useState<string | null>(null);
  const [pinLockInfo, setPinLockInfo] = useState<AppContextValue["pinLockInfo"]>(null);
  const unlockedRef = useRef<Set<string>>(new Set());
  const bootedRef = useRef(false);

  const configured = isFirebaseConfigured;

  const refreshRemembered = useCallback(() => {
    setRemembered(readRemembered());
  }, []);

  const enterSession = useCallback(
    async (u: User): Promise<AuthStatus> => {
      // Firestore call raced against a timeout — the boot must never hang forever.
      const p = await Promise.race([
        getOrCreateProfile(u.uid, u.email ?? "", u.displayName ?? ""),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 12000)),
      ]).catch(() => null);
      if (!p) {
        // Signed in, but the profile couldn't be loaded — show a retry screen
        // instead of an eternal splash. The account marker stays set.
        setUser(u);
        setProfile(null);
        setStatus("error");
        return "error";
      }
      setUser(u);
      setProfile(p);
      setActiveUid(u.uid);
      setActiveUidState(u.uid);
      rememberAccount({
        uid: p.uid,
        email: p.email,
        displayName: p.fullName,
        photoURL: p.avatarUrl,
        pinEnabled: Boolean(p.pin?.enabled),
        lastUsedAt: Date.now(),
      });
      refreshRemembered();
      applyThemeClass(p.preferences?.theme ?? "dark");
      if (p.pin?.enabled && !unlockedRef.current.has(p.uid)) {
        setStatus("locked");
        return "locked";
      }
      setStatus("ready");
      return "ready";
    },
    [refreshRemembered]
  );

  // ── boot: restore remembered sessions ──────────────────────────────────────
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    refreshRemembered();

    if (!configured) {
      setStatus("signed-out");
      return;
    }

    // Only auto-restore the explicitly active account. Remembered accounts are
    // never restored implicitly — that would leak the wrong session on a reload.
    const preferred = getActiveUid();
    if (!preferred) {
      setStatus("signed-out");
      return;
    }
    const candidates = readRemembered().filter((a) => a.uid === preferred);

    if (candidates.length === 0) {
      setStatus("signed-out");
      return;
    }

    let cancelled = false;
    (async () => {
      for (const acct of candidates) {
        if (cancelled) return;
        const auth = getAccountAuth(acct.uid);
        const restored = await new Promise<User | null>((resolve) => {
          const unsub = onAuthStateChanged(
            auth,
            (u) => {
              unsub();
              resolve(u);
            },
            () => {
              unsub();
              resolve(null);
            }
          );
          window.setTimeout(() => {
            unsub();
            resolve(auth.currentUser);
          }, 6000);
        });
        if (cancelled) return;
        if (restored) {
          await enterSession(restored);
          return;
        }
      }
      if (!cancelled) setStatus("signed-out");
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── keep theme in sync with profile ─────────────────────────────────────────
  useEffect(() => {
    if (profile?.preferences?.theme) applyThemeClass(profile.preferences.theme);
  }, [profile?.preferences?.theme]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.uid).catch(() => null);
    if (p) {
      setProfile(p);
      syncRemembered(p);
      refreshRemembered();
    }
  }, [user, refreshRemembered]);

  const applyProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        syncRemembered(next);
        refreshRemembered();
        return next;
      });
    },
    [refreshRemembered]
  );

  // ── auth flows ──────────────────────────────────────────────────────────────
  const bootstrapSignIn = useCallback(
    async (email: string, password: string): Promise<User> => {
      const bootstrap = getAuth(getDefaultApp());
      await setPersistence(bootstrap, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(bootstrap, email.trim(), password);
      // Move the session onto its dedicated per-account app instance.
      const accountAuth = getAccountAuth(cred.user.uid);
      await setPersistence(accountAuth, browserLocalPersistence);
      await signInWithEmailAndPassword(accountAuth, email.trim(), password);
      await firebaseSignOut(bootstrap);
      return accountAuth.currentUser ?? cred.user;
    },
    []
  );

  const signIn = useCallback<AppContextValue["signIn"]>(
    async (email, password) => {
      if (!configured) return { ok: false, error: "Firebase is not configured yet. See README / .env.example." };
      try {
        const u = await bootstrapSignIn(email, password);
        await enterSession(u);
        const profile = await fetchProfile(u.uid).catch(() => undefined);
        return { ok: true, profile: profile ?? undefined };
      } catch (e) {
        const code = (e as { code?: string })?.code;
        return { ok: false, error: authErrorMessage(code) };
      }
    },
    [bootstrapSignIn, configured, enterSession]
  );

  const signUp = useCallback<AppContextValue["signUp"]>(
    async (fullName, email, password) => {
      if (!configured) return { ok: false, error: "Firebase is not configured yet. See README / .env.example." };
      try {
        const bootstrap = getAuth(getDefaultApp());
        await setPersistence(bootstrap, browserLocalPersistence);
        const cred = await createUserWithEmailAndPassword(bootstrap, email.trim(), password);
        await firebaseUpdateProfile(cred.user, { displayName: fullName.trim() }).catch(() => {});
        const accountAuth = getAccountAuth(cred.user.uid);
        await setPersistence(accountAuth, browserLocalPersistence);
        await signInWithEmailAndPassword(accountAuth, email.trim(), password);
        await firebaseSignOut(bootstrap);
        const profile = await createProfile(cred.user.uid, email.trim(), fullName.trim());
        const activeUser = accountAuth.currentUser ?? cred.user;
        setUser(activeUser);
        setProfile(profile);
        setActiveUid(profile.uid);
        setActiveUidState(profile.uid);
        rememberAccount({
          uid: profile.uid,
          email: profile.email,
          displayName: profile.fullName,
          photoURL: null,
          pinEnabled: false,
          lastUsedAt: Date.now(),
        });
        refreshRemembered();
        setStatus("ready");
        return { ok: true, profile };
      } catch (e) {
        const code = (e as { code?: string })?.code;
        console.error("[YOU auth trace] signUp failed:", code, e);
        return { ok: false, error: authErrorMessage(code) };
      }
    },
    [configured, refreshRemembered]
  );

  const sendPasswordReset = useCallback<AppContextValue["sendPasswordReset"]>(
    async (email) => {
      if (!configured) return { ok: false, error: "Firebase is not configured yet." };
      try {
        const bootstrap = getAuth(getDefaultApp());
        await sendPasswordResetEmail(bootstrap, email.trim());
        return { ok: true };
      } catch (e) {
        const code = (e as { code?: string })?.code;
        return { ok: false, error: authErrorMessage(code) };
      }
    },
    [configured]
  );

  const signOutActive = useCallback(async () => {
    const uid = activeUid;
    if (uid) {
      unlockedRef.current.delete(uid); // re-lock on next visit
      await firebaseSignOut(getAccountAuth(uid)).catch(() => {});
    }
    setActiveUid(null);
    setActiveUidState(null);
    setUser(null);
    setProfile(null);
    setPinLockInfo(null);
    setStatus("signed-out");
  }, [activeUid]);

  const switchAccount = useCallback<AppContextValue["switchAccount"]>(
    async (uid) => {
      const auth = getAccountAuth(uid);
      const restored = await new Promise<User | null>((resolve) => {
        const unsub = onAuthStateChanged(
          auth,
          (u) => {
            unsub();
            resolve(u);
          },
          () => {
            unsub();
            resolve(null);
          }
        );
        window.setTimeout(() => {
          unsub();
          resolve(auth.currentUser);
        }, 5000);
      });

      // The current account's session stays persisted on this device — that is
      // what lets users switch back without re-entering credentials.
      // Switching away re-locks the outgoing PIN-protected account.
      if (activeUid && activeUid !== uid) {
        unlockedRef.current.delete(activeUid);
      }
      if (!restored) {
        setUser(null);
        setProfile(null);
        setStatus("signed-out");
        setActiveUid(null);
        setActiveUidState(null);
        return "needs-auth";
      }
      const result = await enterSession(restored);
      return result === "locked" ? "locked" : "ready";
    },
    [activeUid, enterSession]
  );

  const switchIntentRef = useRef<"signup" | "signin" | null>(null);

  const consumeSwitchIntent = useCallback(() => {
    const intent = switchIntentRef.current;
    switchIntentRef.current = null;
    return intent;
  }, []);

  const prepareAddAccount = useCallback((intent: "signup" | "signin" = "signup") => {
    // Remember WHY we're leaving the private area so the redirect below
    // lands on the matching auth modal instead of racing with a bare push.
    switchIntentRef.current = intent;
    // Leaving a PIN-protected account — lock it again for the next visitor.
    if (activeUid) unlockedRef.current.delete(activeUid);
    // Keep the active session persisted but leave the signed-in view.
    setUser(null);
    setProfile(null);
    setStatus("signed-out");
    setActiveUid(null);
    setActiveUidState(null);
  }, [activeUid]);

  const forgetAccountDevice = useCallback<AppContextValue["forgetAccountDevice"]>(
    async (uid) => {
      await firebaseSignOut(getAccountAuth(uid)).catch(() => {});
      await deleteAccountApp(uid).catch(() => {});
      forgetAccount(uid);
      unlockedRef.current.delete(uid);
      if (activeUid === uid) {
        setUser(null);
        setProfile(null);
        setActiveUidState(null);
        setStatus("signed-out");
      }
      refreshRemembered();
    },
    [activeUid, refreshRemembered]
  );

  // ── PIN flows ───────────────────────────────────────────────────────────────
  const unlockWithPin = useCallback<AppContextValue["unlockWithPin"]>(
    async (pin) => {
      if (!profile?.pin?.enabled) {
        setStatus("ready");
        return { ok: true };
      }
      const rate = getPinRateState(profile.uid);
      if (rate.lockUntil > Date.now()) {
        return { ok: false, error: "Too many attempts.", lockedForMs: rate.lockUntil - Date.now() };
      }
      const ok = await verifyPin(pin, profile.pin);
      if (ok) {
        unlockedRef.current.add(profile.uid);
        resetPinAttempts(profile.uid);
        setPinLockInfo(null);
        setStatus("ready");
        return { ok: true };
      }
      const next = recordPinFailure(profile.uid);
      const remaining = Math.max(0, 5 - (next.fails % 3 === 0 ? next.fails : next.fails));
      setPinLockInfo({ lockUntil: next.lockUntil, remainingFails: remaining });
      if (next.lockUntil > Date.now()) {
        return {
          ok: false,
          error: "Too many incorrect attempts. Temporarily locked.",
          lockedForMs: next.lockUntil - Date.now(),
        };
      }
      return { ok: false, error: "Incorrect PIN. Try again." };
    },
    [profile]
  );

  const enablePin = useCallback<AppContextValue["enablePin"]>(
    async (pin) => {
      if (!user) return { ok: false, error: "Not signed in." };
      try {
        const verifier = await createPinVerifier(pin);
        await updateProfile(user.uid, { pin: verifier });
        unlockedRef.current.add(user.uid);
        applyProfile({ pin: verifier });
        resetPinAttempts(user.uid);
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not enable PIN. Please try again." };
      }
    },
    [user, applyProfile]
  );

  const disablePin = useCallback<AppContextValue["disablePin"]>(
    async (currentPin) => {
      if (!user || !profile?.pin?.enabled) return { ok: false, error: "PIN is not enabled." };
      const ok = await verifyPin(currentPin, profile.pin);
      if (!ok) return { ok: false, error: "Current PIN is incorrect." };
      await updateProfile(user.uid, { pin: null });
      applyProfile({ pin: null });
      return { ok: true };
    },
    [user, profile, applyProfile]
  );

  const changePin = useCallback<AppContextValue["changePin"]>(
    async (currentPin, nextPin) => {
      if (!user || !profile?.pin?.enabled) return { ok: false, error: "PIN is not enabled." };
      const ok = await verifyPin(currentPin, profile.pin);
      if (!ok) return { ok: false, error: "Current PIN is incorrect." };
      const verifier = await createPinVerifier(nextPin);
      await updateProfile(user.uid, { pin: verifier });
      applyProfile({ pin: verifier });
      return { ok: true };
    },
    [user, profile, applyProfile]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      configured,
      status,
      user,
      profile,
      remembered,
      activeUid,
      pinLockInfo,
      signIn,
      signUp,
      sendPasswordReset,
      signOutActive,
      switchAccount,
      prepareAddAccount,
      consumeSwitchIntent,
      forgetAccountDevice,
      unlockWithPin,
      enablePin,
      disablePin,
      changePin,
      refreshProfile,
      applyProfile,
    }),
    [
      configured,
      status,
      user,
      profile,
      remembered,
      activeUid,
      pinLockInfo,
      signIn,
      signUp,
      sendPasswordReset,
      signOutActive,
      switchAccount,
      prepareAddAccount,
      consumeSwitchIntent,
      forgetAccountDevice,
      unlockWithPin,
      enablePin,
      disablePin,
      changePin,
      refreshProfile,
      applyProfile,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
