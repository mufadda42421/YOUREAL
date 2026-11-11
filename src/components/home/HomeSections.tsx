"use client";

import { useState } from "react";
import {
  UserRound,
  LayoutGrid,
  Blocks,
  HardDrive,
  KeyRound,
  Users,
  ArrowRight,
  Sparkles,
  Code2,
  Gamepad2,
  Music,
  GraduationCap,
  Plane,
  BookOpen,
  ChevronDown,
  Check,
} from "lucide-react";
import { cx } from "@/lib/utils";

/* ─── Philosophy marquee ─────────────────────────────────────────────────── */

const MARQUEE = [
  "Quiet Architecture",
  "Becoming",
  "Deep Work",
  "Second Brain",
  "Intentional Living",
  "The Maker's Notebook",
  "Self-Knowledge",
  "Digital Gardens",
];

export function PhilosophyMarquee() {
  const row = [...MARQUEE, ...MARQUEE];
  return (
    <div id="philosophy" className="relative overflow-hidden border-y border-white/5 bg-[#0a0a0e] py-3">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#0a0a0e] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#0a0a0e] to-transparent"
      />
      <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-10 text-[13px] font-semibold uppercase tracking-[0.28em] text-neutral-600"
          >
            {item}
            <Sparkles className="h-3 w-3 text-indigo-500/60" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Why YOU (features) ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: UserRound,
    title: "A profile that is actually you",
    body: "Preferred name, values, interests, ambitions, communication style — YOU builds your identity profile once and remembers it forever.",
    tint: "text-indigo-400 bg-indigo-500/10",
  },
  {
    icon: LayoutGrid,
    title: "My Worlds — your private spaces",
    body: "Build independent worlds for coding, gaming, music, learning or anything else. Each with its own look, widgets and layout.",
    tint: "text-cyan-400 bg-cyan-500/10",
  },
  {
    icon: Blocks,
    title: "15 functional widgets",
    body: "Notes, tasks, calendar, weather, music, galleries, goals, journal, countdowns and more — drag, drop, resize, done.",
    tint: "text-violet-400 bg-violet-500/10",
  },
  {
    icon: HardDrive,
    title: "My Media — yours, organized",
    body: "Import photos, videos, audio, PDFs and documents. Search, sort, folders, collections — everything stored privately to your account.",
    tint: "text-emerald-400 bg-emerald-500/10",
  },
  {
    icon: KeyRound,
    title: "PIN privacy layer",
    body: "Optional 4-digit PIN for shared devices. PBKDF2-hashed, rate-limited, with per-account lockout. Never a replacement for sign-in.",
    tint: "text-amber-400 bg-amber-500/10",
  },
  {
    icon: Users,
    title: "Multiple accounts, one device",
    body: "Switch between your own accounts — or your family's — on the same device. Everyone's data stays isolated, always.",
    tint: "text-rose-400 bg-rose-500/10",
  },
];

export function Features() {
  return (
    <section id="why" className="bg-[#08080a] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-400">Why YOU</p>
          <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl">
            One universe.
            <br />
            <span className="text-neutral-500">Everything about you.</span>
          </h2>
          <p className="mt-4 text-neutral-400">
            Generic dashboards treat everyone the same. YOU is architected around a single
            premise: the best software is the software that knows who it belongs to.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-indigo-500/30 hover:bg-indigo-500/[0.04]"
            >
              <div className={cx("inline-flex rounded-xl p-2.5", f.tint)}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────────────────── */

const STEPS = [
  {
    step: "01",
    title: "Tell us who you are",
    body: "Two minutes of honest onboarding — your name, interests, ambitions, rhythms and preferences. Skip anything you like.",
  },
  {
    step: "02",
    title: "We build your world",
    body: "YOU generates your profile, personalizes your home and hands you a blank canvas of worlds and widgets to compose.",
  },
  {
    step: "03",
    title: "Live in it every day",
    body: "Journal, plan, streak, collect and create. Everything you save becomes part of a private archive of you.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative border-y border-white/5 bg-[#0a0a0e] py-20 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(900px 400px at 50% 0%, rgba(99,102,241,.09), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-400">How YOU works</p>
          <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl">
            From stranger to <span className="text-neutral-500">self-aware</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative">
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-[calc(100%+0.5rem)] top-6 hidden h-px w-[calc(2.5rem-1rem)] bg-gradient-to-r from-indigo-500/60 to-transparent md:block"
                />
              )}
              <p className="font-mono text-xs text-indigo-400">{s.step}</p>
              <h3 className="mt-2 text-xl font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Worlds showcase ────────────────────────────────────────────────────── */

const WORLDS = [
  { name: "Coding World", icon: Code2, css: "linear-gradient(135deg,#312e81 0%,#6366f1 55%,#22d3ee 130%)", widgets: ["Notes", "Tasks", "Journal"] },
  { name: "Gaming World", icon: Gamepad2, css: "linear-gradient(135deg,#2e1065 0%,#7c3aed 55%,#c084fc 130%)", widgets: ["Quotes", "Quick Links", "Countdown"] },
  { name: "Music World", icon: Music, css: "linear-gradient(135deg,#500724 0%,#be185d 55%,#fb7185 130%)", widgets: ["Music", "Photos", "Bookmarks"] },
  { name: "Learning World", icon: GraduationCap, css: "linear-gradient(135deg,#052e16 0%,#166534 55%,#4ade80 130%)", widgets: ["Calendar", "Goals", "Files"] },
  { name: "Travel World", icon: Plane, css: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 55%,#38bdf8 130%)", widgets: ["Photos", "Countdown", "Notes"] },
  { name: "Reading World", icon: BookOpen, css: "linear-gradient(135deg,#422006 0%,#a16207 55%,#fde047 130%)", widgets: ["Notes", "Quotes", "Journal"] },
];

export function WorldsShowcase() {
  return (
    <section id="worlds" className="bg-[#08080a] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-400">My Worlds</p>
            <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl">
              Different obsessions.
              <br />
              <span className="text-neutral-500">One home.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-neutral-400">
            Every world is an independent workspace with its own aesthetic, widgets, media and
            privacy. Pin your favorites. Make one the default. Live between them.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {WORLDS.map((w) => (
            <div
              key={w.name}
              className="group overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-white/10"
            >
              <div
                className="flex h-28 flex-col justify-between p-3"
                style={{ background: w.css }}
              >
                <w.icon className="h-5 w-5 text-white/90 transition-transform duration-300 group-hover:scale-110" />
                <p className="text-[11px] font-extrabold leading-tight text-white">{w.name}</p>
              </div>
              <div className="flex flex-wrap gap-1 p-3">
                {w.widgets.map((widget) => (
                  <span
                    key={widget}
                    className="rounded-full border border-white/5 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold text-neutral-400"
                  >
                    {widget}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Manifesto ──────────────────────────────────────────────────────────── */

export function Manifesto() {
  return (
    <section id="manifesto" className="border-t border-white/5 bg-[#0a0a0e] py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Sparkles className="mx-auto h-6 w-6 text-indigo-400" />
        <p className="mt-6 text-balance text-2xl font-semibold leading-snug tracking-[-0.02em] text-neutral-200 sm:text-3xl">
          &ldquo;You are not building a streak for an algorithm.
          <span className="text-indigo-400"> You are building trust with your future self.</span>&rdquo;
        </p>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-600">
          The YOU Manifesto
        </p>
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "What exactly is YOU?",
    a: "YOU is your private digital universe — onboarding that learns who you are, a personalized home, independent 'worlds' with real widgets (notes, tasks, journal, media), and a private archive of your growth. Think of it as a home for your digital self, not another feed.",
  },
  {
    q: "Is my data private?",
    a: "Yes — private by default, enforced at the database level. Your profile, worlds, widgets and media are readable and writable only by your account (owner-based Firestore and Storage security rules). Optional PIN locking adds a privacy layer for shared devices.",
  },
  {
    q: "Can I use it with my family on one laptop?",
    a: "Absolutely. Remembered accounts appear on the sign-in screen — each switches instantly (PIN if enabled), and nobody ever sees anyone else's data, notes, media or goals.",
  },
  {
    q: "How much does YOU cost?",
    a: "Free to start, and your world stays yours. We will never sell your data — there is nothing in here worth more to us than your trust.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-[#08080a] py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-400">Questions</p>
        <h2 className="mt-3 text-center text-balance text-4xl font-extrabold tracking-[-0.03em] text-white">
          Before you ask
        </h2>
        <div className="mt-12 divide-y divide-white/5 rounded-2xl border border-white/5 bg-white/[0.02]">
          {FAQS.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={open === i}
              >
                <span className="text-sm font-semibold text-white">{item.q}</span>
                <ChevronDown
                  className={cx(
                    "h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-300",
                    open === i && "rotate-180 text-indigo-400"
                  )}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm leading-relaxed text-neutral-400">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ──────────────────────────────────────────────────────────── */

export function FinalCta({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#08080a] py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(700px 400px at 50% 120%, rgba(99,102,241,.28), transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-balance text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-6xl">
          The internet is everyone.
          <br />
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
            Ready to meet you?
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-neutral-400">
          Two minutes of honesty. A lifetime of personalization. Your world is waiting.
        </p>
        <button onClick={onGetStarted} className="btn btn-primary mx-auto mt-9 !px-8 !py-4 text-base">
          Create your world — free <ArrowRight className="h-5 w-5" />
        </button>
        <p className="mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
          <Check className="h-3.5 w-3.5 text-emerald-500" /> No credit card · Private by default
        </p>
      </div>
    </section>
  );
}
