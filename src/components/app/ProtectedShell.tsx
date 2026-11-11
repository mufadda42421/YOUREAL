"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { PinUnlockScreen } from "@/components/app/PinUnlockScreen";
import { LogoMark } from "@/components/ui/Logo";
import { useApp } from "@/components/providers/AppProvider";
import { firebaseSetupInstructions } from "@/lib/firebase/config";

/**
 * Protected shell — route protection for every authenticated page.
 * Unauthenticated users are sent to the public homepage with the sign-in
 * modal open; new users are sent to onboarding before they can go further.
 */
export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { status, profile, configured, signOutActive, consumeSwitchIntent } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const onboardingNeeded =
    status === "ready" && profile && !profile.onboardingCompleted;

  useEffect(() => {
    if (!configured || status === "loading") return;
    if (status === "signed-out") {
      const intent = consumeSwitchIntent() ?? "signin";
      router.replace(`/?auth=${intent}&next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (onboardingNeeded) {
      router.replace("/onboarding");
    }
  }, [status, onboardingNeeded, router, pathname, configured, consumeSwitchIntent]);

  if (!configured) {
    return <FirebaseNotConfigured />;
  }

  if (status === "error") {
    return <BootError onRetry={() => window.location.reload()} onSignOut={() => void signOutActive()} />;
  }

  if (status === "loading") {
    return <Splash label="Opening your world…" />;
  }

  if (status === "locked") {
    // Never render private data while locked.
    return <PinUnlockScreen />;
  }

  if (status === "signed-out" || onboardingNeeded) {
    // Redirect in flight — render the branded splash, never private data.
    return <Splash />;
  }

  return <AppShell>{children}</AppShell>;
}

function BootError({ onRetry, onSignOut }: { onRetry: () => void; onSignOut: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--app-bg)] px-6 text-center">
      <LogoMark size={48} />
      <h1 className="text-xl font-extrabold text-[var(--app-text)]">Couldn&apos;t reach your world</h1>
      <p className="max-w-sm text-sm leading-relaxed text-[var(--app-muted)]">
        You&apos;re signed in, but your data couldn&apos;t be loaded — usually a connection issue or Firebase being
        briefly unreachable. Check your network and try again.
      </p>
      <div className="flex gap-2">
        <button onClick={onRetry} className="btn btn-primary !py-2 text-xs">Retry</button>
        <button onClick={onSignOut} className="btn btn-ghost !py-2 text-xs">Sign out</button>
      </div>
    </div>
  );
}

export function Splash({ label }: { label?: string } = {}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--app-bg)]">
      <LogoMark size={44} className="animate-pulse" />
      {label && (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--app-muted)]">
          {label}
        </p>
      )}
    </div>
  );
}

function FirebaseNotConfigured() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--app-bg)] px-6 py-10 text-center">
      <LogoMark size={52} />
      <h1 className="mt-6 text-2xl font-extrabold text-[var(--app-text)]">Firebase isn&apos;t configured yet</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--app-muted)]">
        YOU needs a Firebase project to store your account, worlds and media. To wire it up:
      </p>
      <ol className="mt-4 max-w-md space-y-2 text-left text-xs text-[var(--app-muted)]">
        {firebaseSetupInstructions.map((step, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 font-mono text-[9px] font-bold text-indigo-300">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <Link href="/" className="btn btn-ghost mt-6">Back to the homepage</Link>
    </div>
  );
}
