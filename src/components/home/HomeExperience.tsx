"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HomeNav } from "@/components/home/HomeNav";
import { HomeHero } from "@/components/home/HomeHero";
import {
  PhilosophyMarquee,
  Features,
  HowItWorks,
  WorldsShowcase,
  Manifesto,
  Faq,
  FinalCta,
} from "@/components/home/HomeSections";
import { HomeFooter } from "@/components/home/HomeFooter";
import { AuthModal, type AuthMode } from "@/components/auth/AuthModal";
import { useApp } from "@/components/providers/AppProvider";

function scrollToHow() {
  document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HomeExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useApp();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  // Deep links: /?auth=signin|signup|reset opens the modal
  useEffect(() => {
    const m = searchParams.get("auth");
    if (m === "signin" || m === "signup" || m === "reset") {
      setAuthMode(m);
      setAuthOpen(true);
    }
  }, [searchParams]);

  // Signed-in users land on the homepage only deliberately — show a hint CTA,
  // never a broken empty state.
  const openAuth = useCallback(
    (mode: AuthMode) => {
      setAuthMode(mode);
      setAuthOpen(true);
      router.replace(`/?auth=${mode}`, { scroll: false });
    },
    [router]
  );

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    router.replace("/", { scroll: false });
  }, [router]);

  const goToDashboard = useCallback(() => router.push("/dashboard"), [router]);

  const isAuthed = status === "ready" || status === "locked";
  const primaryCta = isAuthed ? goToDashboard : () => openAuth("signup");

  return (
    <main className="min-h-dvh bg-[#08080a] text-neutral-100">
      <HomeNav onSignIn={() => openAuth("signin")} onSignUp={() => openAuth("signup")} />
      <HomeHero onGetStarted={primaryCta} onSeeHow={scrollToHow} />
      <PhilosophyMarquee />
      <Features />
      <HowItWorks />
      <WorldsShowcase />
      <Manifesto />
      <Faq />
      <FinalCta onGetStarted={primaryCta} />
      <HomeFooter />
      <AuthModal
        open={authOpen}
        mode={authMode}
        redirectTo={searchParams.get("next") ?? undefined}
        onModeChange={(m) => {
          setAuthMode(m);
          router.replace(`/?auth=${m}`, { scroll: false });
        }}
        onClose={closeAuth}
      />
    </main>
  );
}
