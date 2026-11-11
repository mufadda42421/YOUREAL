import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms that govern your use of YOU.",
};

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-[#08080a] px-4 py-16 text-neutral-300 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to YOU
        </Link>
        <div className="mt-8 flex items-center gap-3">
          <LogoMark size={36} />
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Terms of YOU</h1>
        </div>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-600">Last updated · November 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-white">1. Your account</h2>
            <p className="mt-1.5">
              You must provide accurate information when creating your account. You are responsible for activity on your
              account and for keeping your credentials confidential. Multiple accounts per device are supported; only
              you may access your own worlds.
            </p>
          </section>
          <section>
            <h2 className="text-base font-bold text-white">2. Your content</h2>
            <p className="mt-1.5">
              Everything you create or upload — notes, journal entries, media, worlds — remains yours. By using YOU you
              grant us only the rights needed to store, sync and display your content back to you within the service.
            </p>
          </section>
          <section>
            <h2 className="text-base font-bold text-white">3. Acceptable use</h2>
            <ul className="mt-1.5 list-disc space-y-1.5 pl-5">
              <li>Do not upload unlawful, infringing or harmful content.</li>
              <li>Do not attempt to access other users&apos; data or bypass security rules.</li>
              <li>Do not abuse storage or infrastructure (no mining, no botnet files).</li>
            </ul>
          </section>
          <section>
            <h2 className="text-base font-bold text-white">4. Service and availability</h2>
            <p className="mt-1.5">
              YOU is provided as-is. We work hard to keep it fast and reliable, but we do not guarantee uninterrupted
              availability. Export your important data periodically from Settings.
            </p>
          </section>
          <section>
            <h2 className="text-base font-bold text-white">5. Termination</h2>
            <p className="mt-1.5">
              You may delete your account at any time from Settings; deletion removes your content as described in the
              Privacy page. We may suspend accounts that violate these terms.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
