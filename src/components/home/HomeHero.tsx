"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Code2,
  Flame,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Headphones,
  Circle,
} from "lucide-react";

interface HomeHeroProps {
  onGetStarted: () => void;
  onSeeHow: () => void;
}

export function HomeHero({ onGetStarted, onSeeHow }: HomeHeroProps) {
  return (
    <section id="top" className="relative overflow-hidden bg-[#08080a] pt-16">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1000px 520px at 18% -5%, rgba(99,102,241,.28), transparent 60%), radial-gradient(900px 520px at 88% 8%, rgba(236,72,153,.17), transparent 55%), radial-gradient(700px 600px at 55% 120%, rgba(34,211,238,.10), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 40%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-20">
        {/* Copy */}
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 py-1.5 pl-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-300"
          >
            <Sparkles className="h-3.5 w-3.5" />
            The personal digital universe
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-6 text-balance text-5xl font-extrabold leading-[1.02] tracking-[-0.035em] text-white sm:text-6xl xl:text-7xl"
          >
            Your World.
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              Your Way.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.17 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-400"
          >
            YOU is your private digital home — a workspace that actually knows you.
            Tell it who you are, build the worlds you want to live in, and let it
            remember everything else.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <button onClick={onGetStarted} className="btn btn-primary !px-6 !py-3.5 text-base">
              Get Started — it&apos;s free
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={onSeeHow}
              className="btn !px-6 !py-3.5 text-base text-neutral-200 transition-colors hover:text-white"
            >
              See how it works
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500"
          >
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Private by default</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-indigo-400" /> Free to start</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-indigo-400" /> No credit card</span>
          </motion.div>
        </div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.75, delay: 0.2, type: "spring", damping: 26 }}
          className="relative mx-auto w-full max-w-lg"
        >
          {/* Floating streak badge */}
          <div className="absolute -left-1 -top-5 z-10 animate-float rounded-2xl border border-amber-400/20 bg-[#141109]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md sm:-left-8">
            <div className="flex items-center gap-2.5">
              <Flame className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-sm font-extrabold leading-none text-amber-200">26 days</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-amber-500/90">deep work streak</p>
              </div>
            </div>
          </div>

          {/* Floating privacy badge */}
          <div className="absolute -right-1 bottom-24 z-10 animate-float rounded-2xl border border-emerald-400/20 bg-[#081410]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md [animation-delay:1.4s] [animation-duration:8.5s] sm:-right-8">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-extrabold leading-none text-emerald-200">Only yours</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-emerald-500/90">end-to-end private</p>
              </div>
            </div>
          </div>

          {/* Window chrome */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101014] shadow-[0_40px_80px_-20px_rgba(0,0,0,.7),0_0_60px_-20px_rgba(99,102,241,.35)]">
            <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.03] px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <div className="mx-auto flex items-center gap-1.5 rounded-md bg-black/40 px-3 py-1 font-mono text-[10px] text-neutral-500">
                you.app/dashboard
              </div>
              <div className="w-10" />
            </div>

            <div className="space-y-4 p-5">
              {/* Greeting row */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-sm font-extrabold text-white">
                  AN
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Good evening, Aria</p>
                  <p className="text-[10px] text-neutral-500">Tuesday · November 11 · Your Coding World awaits</p>
                </div>
                <Headphones className="ml-auto h-4 w-4 text-neutral-600" />
              </div>

              {/* Featured world + stats */}
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3 overflow-hidden rounded-xl border border-white/5">
                  <div
                    className="flex h-24 flex-col justify-between p-3"
                    style={{ background: "linear-gradient(135deg,#312e81 0%,#6366f1 55%,#22d3ee 120%)" }}
                  >
                    <Code2 className="h-5 w-5 text-white/90" />
                    <div>
                      <p className="text-[11px] font-extrabold text-white">Coding World</p>
                      <p className="text-[8px] font-medium uppercase tracking-wider text-indigo-100/70">12 widgets · pinned</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex flex-col justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500">Focus this week</p>
                  <div>
                    <p className="text-2xl font-extrabold leading-none text-white">26<span className="text-xs text-neutral-500">h</span></p>
                    <div className="mt-1.5 flex gap-0.5">
                      {[80, 45, 95, 60, 100, 70, 30].map((h, i) => (
                        <div key={i} className="h-6 w-1.5 self-end rounded-sm bg-indigo-500/70" style={{ height: `${(h / 100) * 24 + 3}px` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task + goal row */}
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3 space-y-1.5 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500">Today</p>
                  {[
                    { t: "Ship YOU onboarding flow", done: true },
                    { t: "Read 20 pages of The Creative Act", done: false },
                    { t: "Push deep-work session to 90 min", done: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      {item.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                      )}
                      <span className={item.done ? "text-neutral-600 line-through" : "text-neutral-300"}>
                        {item.t}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="col-span-2 space-y-1.5 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                    <CalendarCheck className="h-3 w-3" /> Goal
                  </p>
                  <p className="text-[11px] font-semibold leading-snug text-neutral-200">Publish &ldquo;Quiet Architecture&rdquo;</p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
                  </div>
                  <p className="text-[9px] text-neutral-500">72% · on track</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
