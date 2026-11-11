import Link from "next/link";
import { LogoMark, LogoWordmark } from "@/components/ui/Logo";
import { Lock } from "lucide-react";

export function HomeFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/5 bg-[#060608]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <LogoMark size={30} />
              <LogoWordmark className="text-white" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500">
              Your World. Your Way. A private, personal universe built for the one person
              the internet usually forgets — you.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
              <Lock className="h-3 w-3" /> Private by default
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">Product</p>
            <ul className="mt-3 space-y-2.5 text-sm text-neutral-400">
              <li><a href="#why" className="transition-colors hover:text-white">Why YOU</a></li>
              <li><a href="#how" className="transition-colors hover:text-white">How it works</a></li>
              <li><a href="#worlds" className="transition-colors hover:text-white">My Worlds</a></li>
              <li><a href="#faq" className="transition-colors hover:text-white">FAQ</a></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">Company</p>
            <ul className="mt-3 space-y-2.5 text-sm text-neutral-400">
              <li><a href="#philosophy" className="transition-colors hover:text-white">Philosophy</a></li>
              <li><a href="#manifesto" className="transition-colors hover:text-white">Manifesto</a></li>
              <li><Link href="/onboarding" className="transition-colors hover:text-white">Get started</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">Legal</p>
            <ul className="mt-3 space-y-2.5 text-sm text-neutral-400">
              <li><Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-white">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-neutral-600">© {year} YOU. Your World. Your Way.</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-700">
            you are you
          </p>
        </div>
      </div>
    </footer>
  );
}
