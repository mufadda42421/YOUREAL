"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, Delete, Loader2, LogOut } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { useToast } from "@/components/providers/Toast";
import { Avatar } from "@/components/ui/Avatar";
import { getPinRateState } from "@/lib/pin";

export function PinUnlockScreen() {
  const { profile, unlockWithPin, signOutActive, status } = useApp();
  const { error } = useToast();
  const [digits, setDigits] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [lockUntil, setLockUntil] = useState<number>(0);
  const [, forceTick] = useState(0);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const uid = profile?.uid ?? "";

  useEffect(() => {
    const state = getPinRateState(uid);
    setLockUntil(state.lockUntil);
  }, [uid, status]);

  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const t = window.setInterval(() => {
      forceTick((n) => n + 1);
      if (Date.now() >= lockUntil) setLockUntil(0);
    }, 500);
    return () => window.clearInterval(t);
  }, [lockUntil]);

  useEffect(() => {
    hiddenInputRef.current?.focus();
  }, []);

  const locked = lockUntil > Date.now();
  const lockSeconds = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));

  const submit = async (pin: string) => {
    setBusy(true);
    const result = await unlockWithPin(pin);
    setBusy(false);
    if (!result.ok) {
      setShake((s) => s + 1);
      setDigits([]);
      if (result.lockedForMs) {
        setLockUntil(Date.now() + result.lockedForMs);
        error("Temporarily locked", "Too many incorrect attempts. Please wait.");
      } else {
        error("Incorrect PIN", result.error ?? "Try again.");
      }
    }
  };

  const pushDigit = (d: string) => {
    if (busy || locked) return;
    setDigits((prev) => {
      if (prev.length >= 4) return prev;
      const next = [...prev, d];
      if (next.length === 4) void submit(next.join(""));
      return next;
    });
  };

  const popDigit = () => setDigits((prev) => prev.slice(0, -1));

  const onHiddenKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      pushDigit(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      popDigit();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#08080a] px-4">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 500px at 20% -10%, rgba(99,102,241,.25), transparent 60%), radial-gradient(800px 500px at 85% 110%, rgba(236,72,153,.16), transparent 55%)",
        }}
      />
      <input
        ref={hiddenInputRef}
        value=""
        onChange={() => {}}
        onKeyDown={onHiddenKey}
        className="absolute h-0 w-0 opacity-0"
        autoFocus
        inputMode="numeric"
        aria-label="PIN entry"
      />

      <motion.div
        className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/8 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Avatar
          name={profile?.fullName ?? "You"}
          src={profile?.avatarUrl}
          size={72}
          className="ring-2 ring-indigo-500/40"
        />
        <h1 className="mt-4 text-xl font-bold text-white">
          Welcome back{profile?.preferredName ? `, ${profile.preferredName}` : ""}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
          <Lock className="h-3.5 w-3.5" /> Enter your 4-digit PIN to unlock your world
        </p>

        {/* Digit indicators */}
        <motion.div
          key={shake}
          className="mt-7 flex items-center gap-4"
          animate={
            shake > 0
              ? { x: [0, -14, 14, -10, 10, -6, 6, 0] }
              : undefined
          }
          transition={{ duration: 0.45 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex h-14 w-12 items-center justify-center rounded-xl border text-2xl font-bold transition-all duration-150 ${
                locked
                  ? "border-rose-500/30 bg-rose-500/5 text-rose-300"
                  : digits[i]
                  ? "border-indigo-400/60 bg-indigo-500/10 text-indigo-200 shadow-[0_0_18px_-4px_rgba(99,102,241,.5)]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {digits[i] ? "●" : ""}
            </div>
          ))}
        </motion.div>

        {locked ? (
          <div className="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-center">
            <p className="text-sm font-semibold text-rose-300">Temporarily locked</p>
            <p className="mt-0.5 font-mono text-xs text-rose-400/80">
              Try again in {lockSeconds}s
            </p>
          </div>
        ) : (
          <p className="mt-5 flex items-center gap-1.5 text-[11px] text-neutral-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Protected on this device · {profile?.email}
          </p>
        )}

        {/* Keypad */}
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => pushDigit(d)}
              disabled={busy || locked}
              className="h-14 w-20 rounded-2xl border border-white/8 bg-white/[0.04] text-xl font-semibold text-neutral-100 transition-all hover:border-indigo-400/40 hover:bg-indigo-500/10 active:scale-95 disabled:opacity-40"
            >
              {d}
            </button>
          ))}
          <button
            onClick={popDigit}
            disabled={busy || locked}
            aria-label="Delete last digit"
            className="flex h-14 w-20 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.02] text-neutral-300 transition-all hover:bg-white/[0.06] active:scale-95 disabled:opacity-40"
          >
            <Delete className="h-5 w-5" />
          </button>
          <button
            onClick={() => pushDigit("0")}
            disabled={busy || locked}
            className="h-14 w-20 rounded-2xl border border-white/8 bg-white/[0.04] text-xl font-semibold text-neutral-100 transition-all hover:border-indigo-400/40 hover:bg-indigo-500/10 active:scale-95 disabled:opacity-40"
          >
            0
          </button>
          <button
            onClick={() => digits.length === 4 && void submit(digits.join(""))}
            disabled={busy || locked || digits.length !== 4}
            aria-label="Unlock"
            className="flex h-14 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
          </button>
        </div>

        <button
          onClick={() => void signOutActive()}
          className="mt-6 flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          Not you? Sign out of this account
        </button>
      </motion.div>
    </div>
  );
}
