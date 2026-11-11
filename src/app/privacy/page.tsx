import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How YOU collects, stores and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#08080a] px-4 py-16 text-neutral-300 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to YOU
        </Link>
        <div className="mt-8 flex items-center gap-3">
          <LogoMark size={36} />
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Privacy at YOU</h1>
        </div>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-600">Last updated · November 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white">The short version</h2>
            <p className="mt-1.5">
              YOU is your private digital universe. Your profile, worlds, widgets, notes, tasks, journal entries,
              goals and media belong to you alone. We do not sell your data, we do not build advertising profiles of
              you, and we do not read your content.
            </p>
          </section>
          <section>
            <h2 className="text-base font-bold text-white">What we store</h2>
            <ul className="mt-1.5 list-disc space-y-1.5 pl-5">
              <li>Account identity: email, display name and hashed credentials via Firebase Authentication.</li>
              <li>Your profile and preferences in Cloud Firestore under <code className="font-mono text-indigo-300">users/&lt;your-uid&gt;</code>.</li>
              <li>Your worlds, widgets, notes, tasks, journal entries and media metadata in Firestore.</li>
              <li>Your uploaded files in Cloud Storage under your account path.</li>
              <li>On shared devices: a device-local list of account identifiers (never passwords or tokens) so remembered accounts can be switched, plus PIN verification data (PBKDF2 hash — never the PIN itself).</li>
            </ul>
          </section>
          <section>
            <h2 className="text-base font-bold text-white">Who can access it</h2>
            <p className="mt-1.5">
              Only you. Owner-based security rules on Firestore and Storage scope every read and write to your
              authenticated account. Other people using the same device never see your data; optional PIN protection
              adds a second, device-local gate.
            </p>
          </section>
          <section>
            <h2 className="text-base font-bold text-white">Your controls</h2>
            <p className="mt-1.5">
              You can edit or export your information, change your password, manage your PIN, sign out, or delete your
              account at any time from Settings. Deleting your account removes your profile, worlds, widgets, notes,
              media metadata and uploaded files.
            </p>
          </section>
          <section>
            <h2 className="text-base font-bold text-white">Contact</h2>
            <p className="mt-1.5">
              Questions about this policy can be raised through the app&apos;s settings &ldquo;Report a problem&rdquo; or by
              replying to onboarding emails from YOU.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
