"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { LogoMark } from "@/components/ui/Logo";
import { useApp } from "@/components/providers/AppProvider";
import { useToast } from "@/components/providers/Toast";
import { validateEmail, validatePassword } from "@/lib/validation";

export type AuthMode = "signin" | "signup" | "reset";

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  redirectTo?: string;
}

export function AuthModal({ open, mode, onModeChange, onClose, redirectTo }: AuthModalProps) {
  const { signIn, signUp, sendPasswordReset, remembered, status } = useApp();
  const { success, error } = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (open) {
      setFormError(null);
      setFieldErrors({});
      setBusy(false);
      setResetSent(false);
    }
  }, [open, mode]);

  const rememberedHint = useMemo(() => remembered.slice(0, 3), [remembered]);

  const routeAfterAuth = (onboardingCompleted: boolean) => {
    onClose();
    if (onboardingCompleted) {
      router.push(redirectTo ?? "/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const nextFieldErrors: Record<string, string> = {};

    if (mode === "signup") {
      if (!fullName.trim() || fullName.trim().length < 2)
        nextFieldErrors.fullName = "Please enter your name.";
    }
    const emailErr = validateEmail(email);
    if (emailErr) nextFieldErrors.email = emailErr;

    if (mode !== "reset") {
      const passErr = mode === "signup" ? validatePassword(password) : !password ? "Password is required." : null;
      if (passErr) nextFieldErrors.password = passErr;
      if (mode === "signup" && password !== confirm)
        nextFieldErrors.confirm = "Passwords do not match.";
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setBusy(true);
    if (mode === "signin") {
      const result = await signIn(email, password);
      setBusy(false);
      if (!result.ok) {
        setFormError(result.error ?? "Could not sign in.");
        return;
      }
      success("Welcome back", "Your world was right where you left it.");
      // Route based on profile — the provider has already loaded it.
      const completed = result.profile?.onboardingCompleted ?? true;
      routeAfterAuth(completed);
      return;
    }
    if (mode === "signup") {
      const result = await signUp(fullName, email, password);
      setBusy(false);
      if (!result.ok) {
        setFormError(result.error ?? "Could not create account.");
        return;
      }
      success("Your world is ready", "Let's get to know the real you.");
      routeAfterAuth(false);
      return;
    }
    // reset
    const result = await sendPasswordReset(email);
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error ?? "Could not send reset email.");
      return;
    }
    setResetSent(true);
  };

  const title =
    mode === "signup" ? "Create your world" : mode === "reset" ? "Reset your password" : "Welcome back";
  const subtitle =
    mode === "signup"
      ? "Two minutes of honesty. A lifetime of personalization."
      : mode === "reset"
      ? "We'll email you a secure link to choose a new password."
      : "Pick up exactly where you left off.";

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <LogoMark size={52} />
        <h2 className="mt-3 text-xl font-extrabold tracking-tight text-[var(--app-text)]">{title}</h2>
        <p className="mt-1 text-xs text-[var(--app-muted)]">{subtitle}</p>
      </div>

      {/* Quick-pick remembered accounts (sign-in only) */}
      {mode === "signin" && rememberedHint.length > 0 && (
        <div className="mt-5">
          <p className="label !mb-2 text-center">Previously on this device</p>
          <div className="flex flex-wrap justify-center gap-2">
            {rememberedHint.map((acct) => (
              <button
                key={acct.uid}
                onClick={() => {
                  setEmail(acct.email);
                  setFieldErrors({});
                  setFormError(null);
                }}
                title={acct.email}
                className="group flex items-center gap-2 rounded-full border border-[var(--app-line)] bg-[var(--app-panel-2)] py-1 pl-1 pr-3 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/10"
              >
                <Avatar name={acct.displayName} src={acct.photoURL} size={26} />
                <span className="max-w-[110px] truncate text-xs font-medium text-[var(--app-text)]">
                  {acct.displayName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "reset" && resetSent ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 text-center">
          <BadgeCheck className="h-10 w-10 text-emerald-400" />
          <h3 className="mt-3 text-sm font-bold text-[var(--app-text)]">Check your inbox</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">
            If an account exists for <span className="font-semibold text-[var(--app-text)]">{email}</span>,
            a password reset link is on its way. The link expires after one hour.
          </p>
          <button onClick={() => onModeChange("signin")} className="btn btn-ghost mt-4 w-full">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-300"
            >
              {formError}
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label htmlFor="auth-name" className="label">Full name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Aria Bennett"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`input pl-10 ${fieldErrors.fullName ? "input-error" : ""}`}
                />
              </div>
              {fieldErrors.fullName && <p className="mt-1.5 text-[11px] text-rose-400">{fieldErrors.fullName}</p>}
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="label">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input pl-10 ${fieldErrors.email ? "input-error" : ""}`}
              />
            </div>
            {fieldErrors.email && <p className="mt-1.5 text-[11px] text-rose-400">{fieldErrors.email}</p>}
          </div>

          {mode !== "reset" && (
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="auth-password" className="label">Password</label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => onModeChange("reset")}
                    className="text-[11px] font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder={mode === "signup" ? "8+ characters, letters and numbers" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input pl-10 pr-11 ${fieldErrors.password ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1.5 text-[11px] text-rose-400">{fieldErrors.password}</p>}
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label htmlFor="auth-confirm" className="label">Confirm password</label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
                <input
                  id="auth-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat it once more"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`input pl-10 ${fieldErrors.confirm ? "input-error" : ""}`}
                />
              </div>
              {fieldErrors.confirm && <p className="mt-1.5 text-[11px] text-rose-400">{fieldErrors.confirm}</p>}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3 text-sm">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "signup" ? "Creating your world…" : mode === "reset" ? "Sending link…" : "Opening your world…"}
              </>
            ) : (
              <>
                {mode === "signup" ? (
                  <>
                    <Sparkles className="h-4 w-4" /> Create my world
                  </>
                ) : mode === "reset" ? (
                  "Email me the link"
                ) : (
                  "Sign in to YOU"
                )}
              </>
            )}
          </button>

          <div className="pt-1 text-center text-xs text-[var(--app-muted)]">
            {mode === "signup" ? (
              <>
                Already have a world?{" "}
                <button type="button" onClick={() => onModeChange("signin")} className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to YOU?{" "}
                <button type="button" onClick={() => onModeChange("signup")} className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Create your world
                </button>
              </>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
