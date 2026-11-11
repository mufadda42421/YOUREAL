"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Circle,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  File as FileIcon,
  Pin,
  Plus,
  Sparkles,
  UploadCloud,
  ListTodo,
  Quote,
  Settings2,
  Check,
  Compass,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { WeatherChip } from "@/components/app/WeatherChip";
import { WorldFormModal, WorldIcon, coverCss } from "@/components/worlds/WorldFormModal";
import {
  listWorlds,
  listMedia,
  listOpenTasksAcrossWorlds,
  createWorld,
  updateTask,
} from "@/lib/firebase/worlds";
import { readRecentWorlds, touchRecentWorld } from "@/lib/recentWorlds";
import { greetingForHour, timeAgo, cx } from "@/lib/utils";
import { QUOTES } from "@/lib/constants";
import type { MediaItem, World, TaskItem } from "@/lib/types";

type OpenTask = TaskItem & { worldId: string; worldName: string };

const MEDIA_ICON: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  pdf: FileText,
  document: FileText,
  other: FileIcon,
};

const SECTION_KEY = "you-dashboard-sections";
interface SectionPrefs {
  worlds: boolean;
  media: boolean;
  tasks: boolean;
  suggestions: boolean;
}
const DEFAULT_SECTIONS: SectionPrefs = { worlds: true, media: true, tasks: true, suggestions: true };

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile } = useApp();
  const uid = user?.uid ?? "";

  const [now, setNow] = useState(() => new Date());
  const [worlds, setWorlds] = useState<World[] | null>(null);
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  const [tasks, setTasks] = useState<OpenTask[] | null>(null);
  const [worldFormOpen, setWorldFormOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [sections, setSections] = useState<SectionPrefs>(DEFAULT_SECTIONS);

  // Live clock
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Section prefs (device-local UI preference — not sensitive data)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SECTION_KEY);
      if (raw) setSections({ ...DEFAULT_SECTIONS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);
  const toggleSection = (key: keyof SectionPrefs) => {
    setSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(SECTION_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const [w, m] = await Promise.all([listWorlds(uid), listMedia(uid)]);
      setWorlds(w);
      setMedia(m.slice(0, 8));
      const open = await listOpenTasksAcrossWorlds(uid, w.map((x) => ({ id: x.id, name: x.name })));
      setTasks(open.slice(0, 6));
    } catch {
      setWorlds((v) => v ?? []);
      setMedia((v) => v ?? []);
      setTasks((v) => v ?? []);
    }
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const recentWorlds = useMemo(() => {
    if (!worlds) return [];
    const recent = readRecentWorlds(uid);
    const byId = new Map(worlds.map((w) => [w.id, w]));
    const merged: World[] = [];
    for (const r of recent) {
      const w = byId.get(r.id);
      if (w) merged.push(w);
    }
    if (merged.length === 0) merged.push(...worlds.slice(0, 4));
    return merged.slice(0, 4);
  }, [worlds, uid]);

  const pinnedWorlds = useMemo(() => (worlds ?? []).filter((w) => w.pinned).slice(0, 4), [worlds]);

  const quoteOfDay = useMemo(() => {
    const idx = Math.floor(Date.now() / 86400000) % QUOTES.length;
    return QUOTES[idx];
  }, []);

  const interestSuggestions = useMemo(() => buildSuggestions(profile?.interests ?? []), [profile?.interests]);

  const toggleTask = async (task: OpenTask) => {
    if (!uid) return;
    // Optimistic
    setTasks((prev) => (prev ?? []).filter((t) => !(t.id === task.id && t.worldId === task.worldId)));
    await updateTask(uid, task.worldId, task.id, { done: true }).catch(() => void load());
  };

  if (!profile) {
    return (
      <div className="p-6">
        <div className="skeleton h-40 w-full rounded-3xl" />
      </div>
    );
  }

  const preferred = profile.preferredName || profile.fullName.split(" ")[0] || "you";
  const hasWorlds = (worlds?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">
      {/* ── Greeting header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-indigo-400">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[var(--app-text)] sm:text-4xl">
            {greetingForHour(now.getHours())}, {preferred}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--app-muted)]">
            {hasWorlds
              ? `${worlds!.length} world${worlds!.length === 1 ? "" : "s"} in your universe — here's where things stand.`
              : "Your universe is a blank canvas. Let's paint it."}
          </p>
          <div className="mt-3">
            <WeatherChip location={profile.location} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] px-5 py-3 text-right">
            <p className="font-mono text-2xl font-bold tabular-nums leading-none text-[var(--app-text)]">
              {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)]">
              Local time
            </p>
          </div>
          <button
            onClick={() => setCustomizing((v) => !v)}
            className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] p-3 text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]"
            aria-pressed={customizing}
            aria-label="Customize sections"
            title="Customize sections"
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Customize toggles */}
      {customizing && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-3">
          <span className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Show sections</span>
          {([
            ["worlds", "Worlds"],
            ["media", "Recent media"],
            ["tasks", "Open tasks"],
            ["suggestions", "For you"],
          ] as Array<[keyof SectionPrefs, string]>).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleSection(key)}
              className={cx(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all",
                sections[key]
                  ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                  : "border-[var(--app-line)] text-[var(--app-muted)]"
              )}
            >
              {sections[key] && <Check className="h-3 w-3" />}
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setWorldFormOpen(true)} className="btn btn-primary">
          <Plus className="h-4 w-4" /> New World
        </button>
        <Link href="/media" className="btn btn-ghost">
          <UploadCloud className="h-4 w-4" /> Upload Media
        </Link>
        <Link href="/worlds" className="btn btn-ghost">
          <Globe2 className="h-4 w-4" /> All Worlds
        </Link>
      </div>

      {/* ── Empty state ── */}
      {worlds !== null && !hasWorlds && (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-indigo-500/30 bg-indigo-500/[0.04] px-6 py-14 text-center">
          <Compass className="h-10 w-10 text-indigo-400" />
          <h2 className="mt-4 text-lg font-bold text-[var(--app-text)]">Chart your first world</h2>
          <p className="mt-1.5 max-w-sm text-sm text-[var(--app-muted)]">
            Worlds are private workspaces dedicated to one obsession — coding, music, travel, anything.
            Give it a name and a vibe, and it’s yours forever.
          </p>
          <button onClick={() => setWorldFormOpen(true)} className="btn btn-primary mt-6">
            <Sparkles className="h-4 w-4" /> Create your first world
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Jump back in */}
          {sections.worlds && hasWorlds && (
            <section aria-label="Your worlds">
              <SectionHeader title="Jump back in" href="/worlds" cta="All worlds" />
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {recentWorlds.map((w) => (
                  <Link
                    key={w.id}
                    href={`/worlds/${w.id}`}
                    onClick={() => touchRecentWorld(uid, w)}
                    className="group overflow-hidden rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] transition-all hover:-translate-y-0.5 hover:border-indigo-500/40"
                  >
                    <div className="flex h-20 items-end p-3" style={{ background: coverCss(w.cover) }}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: w.accent }}>
                        <WorldIcon name={w.icon} className="h-4 w-4 text-white" />
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="flex items-center gap-1.5 truncate text-[12px] font-bold text-[var(--app-text)]">
                        {w.pinned && <Pin className="h-3 w-3 shrink-0 text-amber-400" />}
                        {w.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--app-muted)]">{timeAgo(w.updatedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {pinnedWorlds.length > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  <Pin className="h-3 w-3 text-amber-400" /> Pinned: {pinnedWorlds.map((w) => w.name).join(" · ")}
                </p>
              )}
            </section>
          )}

          {/* Recently imported media */}
          {sections.media && (
            <section aria-label="Recently imported media">
              <SectionHeader title="Recently imported" href="/media" cta="My Media" />
              {media === null ? (
                <div className="skeleton mt-3 h-24 w-full rounded-2xl" />
              ) : media.length === 0 ? (
                <Link
                  href="/media"
                  className="mt-3 flex items-center justify-between rounded-2xl border border-dashed border-[var(--app-line)] p-4 text-sm text-[var(--app-muted)] transition-colors hover:border-indigo-500/40 hover:text-[var(--app-text)]"
                >
                  No media yet — drop your first files into My Media.
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {media.slice(0, 8).map((item) => {
                    const Icon = MEDIA_ICON[item.kind] ?? FileIcon;
                    return (
                      <Link
                        key={item.id}
                        href="/media"
                        title={item.name}
                        className="group flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-[var(--app-line)] bg-[var(--app-panel-2)] transition-all hover:border-indigo-500/40"
                      >
                        {item.kind === "image" && item.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        ) : (
                          <Icon className="h-6 w-6 text-[var(--app-muted)] transition-colors group-hover:text-indigo-400" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* For you — interest-aware suggestions */}
          {sections.suggestions && profile.interests.length > 0 && interestSuggestions.length > 0 && (
            <section aria-label="Suggestions for you">
              <SectionHeader title="Shaped for you" hint="Based on your interests" />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {interestSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(s.href)}
                    className="group rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] p-4 text-left transition-all hover:border-indigo-500/40"
                  >
                    <s.Icon className="h-5 w-5 text-indigo-400" />
                    <p className="mt-2.5 text-[13px] font-bold leading-snug text-[var(--app-text)]">{s.title}</p>
                    <p className="mt-1 text-[11px] leading-snug text-[var(--app-muted)]">{s.body}</p>
                    <p className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
                      Open <ChevronRight className="h-3 w-3" />
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Sidebar column ── */}
        <div className="space-y-6">
          {/* Open tasks */}
          {sections.tasks && (
            <section
              aria-label="Open tasks"
              className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--app-text)]">
                  <ListTodo className="h-4 w-4 text-indigo-400" /> Open loops
                </h2>
                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-300">
                  {tasks?.length ?? "…"}
                </span>
              </div>
              {tasks === null ? (
                <div className="mt-3 space-y-2">
                  {[0, 1, 2].map((i) => <div key={i} className="skeleton h-9 w-full rounded-xl" />)}
                </div>
              ) : tasks.length === 0 ? (
                <div className="mt-4 flex flex-col items-center py-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <p className="mt-2 text-xs font-semibold text-[var(--app-text)]">Inbox zero. Mind quiet.</p>
                  <p className="mt-0.5 text-[10px] text-[var(--app-muted)]">Add tasks from any world&apos;s Tasks widget.</p>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-[var(--app-line)]">
                  {tasks.slice(0, 5).map((t) => (
                    <li key={`${t.worldId}-${t.id}`} className="flex items-start gap-2.5 py-2.5">
                      <button onClick={() => toggleTask(t)} className="mt-0.5 shrink-0 text-[var(--app-muted)] transition-colors hover:text-emerald-400" aria-label="Complete task">
                        <Circle className="h-4 w-4" />
                      </button>
                      <span className="min-w-0">
                        <span className="block text-[12px] leading-snug text-[var(--app-text)]">{t.text}</span>
                        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                          {t.worldName}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Your constellation */}
          <section className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--app-text)]">
                <Sparkles className="h-4 w-4 text-fuchsia-400" /> Your constellation
              </h2>
              <Link href="/settings" className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 hover:text-indigo-300">
                Edit
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.interests.length === 0 ? (
                <p className="text-xs text-[var(--app-muted)]">No interests yet — add some in Settings.</p>
              ) : (
                profile.interests.map((i) => (
                  <span key={i} className="chip">{i}</span>
                ))
              )}
            </div>
            {profile.preferences.goals.length > 0 && (
              <div className="mt-4 border-t border-[var(--app-line)] pt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">In flight</p>
                <ul className="mt-2 space-y-1.5">
                  {profile.preferences.goals.slice(0, 3).map((g, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12px] text-[var(--app-text)]">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Quote of the day */}
          <section className="rounded-2xl border border-[var(--app-line)] bg-gradient-to-br from-indigo-500/[0.08] to-transparent p-5">
            <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--app-muted)]">
              <Quote className="h-3.5 w-3.5 text-indigo-400" /> Signal
            </h2>
            <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-[var(--app-text)]">
              “{quoteOfDay.text}”
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)]">
              {quoteOfDay.author}
            </p>
          </section>
        </div>
      </div>

      <WorldFormModal
        open={worldFormOpen}
        onClose={() => setWorldFormOpen(false)}
        title="Create a new world"
        submitLabel="Create world"
        onSubmit={async (value) => {
          const id = await createWorld(uid, value);
          await load();
          router.push(`/worlds/${id}`);
        }}
      />
    </div>
  );
}

function SectionHeader({ title, href, cta, hint }: { title: string; href?: string; cta?: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-sm font-bold text-[var(--app-text)]">
        {title}
        {hint && <span className="ml-2 text-[10px] font-medium text-[var(--app-muted)]">{hint}</span>}
      </h2>
      {href && cta && (
        <Link href={href} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 hover:text-indigo-300">
          {cta} <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

/* Deterministic interest → suggestion mapping. Real actions, not fake content. */
function buildSuggestions(interests: string[]): Array<{ title: string; body: string; href: string; Icon: typeof Sparkles }> {
  const out: Array<{ title: string; body: string; href: string; Icon: typeof Sparkles }> = [];
  const has = (term: string) => interests.some((i) => i.toLowerCase().includes(term));

  if (has("cod") || has("tech")) {
    out.push({
      title: "Ship a build log in your world",
      body: "Notes widget + Journal widget = a changelog your future self will thank you for.",
      href: "/worlds",
      Icon: Compass,
    });
  }
  if (has("music")) {
    out.push({
      title: "Wire up a Music widget",
      body: "Point it at your audio library in My Media and practice with real controls.",
      href: "/media",
      Icon: Compass,
    });
  }
  if (has("read")) {
    out.push({
      title: "Start a reading journal",
      body: "One entry per book — quotes, friction, and what it changed in you.",
      href: "/worlds",
      Icon: Compass,
    });
  }
  if (has("fitness") || has("sport")) {
    out.push({
      title: "Track daily goals",
      body: "Drop a Daily Goals widget into any world and close your rings.",
      href: "/worlds",
      Icon: Compass,
    });
  }
  if (has("travel")) {
    out.push({
      title: "Build a Travel World",
      body: "Countdown to departure, photo gallery, and a journal of everywhere you land.",
      href: "/worlds",
      Icon: Compass,
    });
  }
  if (has("creativ") || has("art") || has("design")) {
    out.push({
      title: "Make a Creative World",
      body: "Photo and video galleries from your uploads, plus a daily creative prompt in Quotes.",
      href: "/worlds",
      Icon: Compass,
    });
  }
  if (out.length === 0) {
    out.push({
      title: "Create your first world",
      body: "Pick the obsession you can't put down and give it a private space.",
      href: "/worlds",
      Icon: Compass,
    });
  }
  return out.slice(0, 2);
}
