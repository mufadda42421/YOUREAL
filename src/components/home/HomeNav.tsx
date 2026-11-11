"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { LogoMark, LogoWordmark } from "@/components/ui/Logo";
import { useApp } from "@/components/providers/AppProvider";
import { cx } from "@/lib/utils";

interface HomeNavProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const LINKS = [
  { label: "Why YOU", href: "#why" },
  { label: "How it works", href: "#how" },
  { label: "Worlds", href: "#worlds" },
  { label: "FAQ", href: "#faq" },
];

export function HomeNav({ onSignIn, onSignUp }: HomeNavProps) {
  const { status } = useApp();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const signedIn = status === "ready" || status === "locked";

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "border-b border-white/5 bg-[#08080a]/85 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="YOU home">
          <LogoMark size={34} />
          <LogoWordmark className="text-white" />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-neutral-400 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          {signedIn ? (
            <button onClick={() => router.push("/dashboard")} className="btn btn-primary !text-sm">
              Enter your world <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button onClick={onSignIn} className="btn btn-ghost !border-white/10 !text-neutral-200 hover:!border-white/20 hover:!bg-white/5">
                Sign in
              </button>
              <button onClick={onSignUp} className="btn btn-primary">
                Get Started <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-neutral-300 hover:bg-white/5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/5 bg-[#08080a]/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-neutral-300 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 px-2 pt-3">
              {signedIn ? (
                <button onClick={() => router.push("/dashboard")} className="btn btn-primary flex-1">
                  Enter your world <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button onClick={() => { setOpen(false); onSignIn(); }} className="btn btn-ghost flex-1 !border-white/10 text-neutral-200">
                    Sign in
                  </button>
                  <button onClick={() => { setOpen(false); onSignUp(); }} className="btn btn-primary flex-1">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
