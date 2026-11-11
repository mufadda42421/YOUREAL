"use client";

import { useState } from "react";
import {
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Bookmark,
  X,
  Target,
} from "lucide-react";
import { cx } from "@/lib/utils";
import { inputSm, iconBtn, type WidgetProps } from "./common";

/* ─── Daily Goals (config) ──────────────────────────────────────────────── */

interface Goal {
  id: string;
  text: string;
  done: boolean;
}

export function GoalsWidget({ widget, onConfig }: WidgetProps) {
  const goals: Goal[] = (widget.config?.goals as Goal[]) ?? [];
  const [draft, setDraft] = useState("");

  const done = goals.filter((g) => g.done).length;
  const pct = goals.length ? Math.round((done / goals.length) * 100) : 0;

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onConfig({ goals: [...goals, { id: `g_${Date.now()}`, text, done: false }] });
    setDraft("");
  };
  const toggle = (id: string) => onConfig({ goals: goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)) });
  const remove = (id: string) => onConfig({ goals: goals.filter((g) => g.id !== id) });
  const reset = () => onConfig({ goals: goals.map((g) => ({ ...g, done: false })) });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--app-line)] font-mono text-[10px] font-bold text-indigo-300"
          style={{ background: `conic-gradient(#6366f1 ${pct * 3.6}deg, transparent 0deg)` }}
          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--app-panel)]">{pct}</span>
        </div>
        <div className="flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--app-muted)]">Today&apos;s promises</p>
          <p className="text-[12px] font-bold text-[var(--app-text)]">{done}/{goals.length} kept</p>
        </div>
        {done > 0 && goals.length > 0 && (
          <button onClick={reset} className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)] hover:text-indigo-300">Reset</button>
        )}
      </div>

      <div className="mt-2 flex gap-1.5">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Make today count for…" className={inputSm} aria-label="New goal" />
        <button onClick={add} className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-500" aria-label="Add goal"><Plus className="h-4 w-4" /></button>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {goals.length === 0 && (
          <p className="flex flex-col items-center gap-1.5 py-4 text-center text-[11px] text-[var(--app-muted)]">
            <Target className="h-5 w-5 text-lime-400/70" /> Three goals is a good day.
          </p>
        )}
        {goals.map((goal) => (
          <div key={goal.id} className="group flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-[var(--app-panel-2)]">
            <button onClick={() => toggle(goal.id)} aria-pressed={goal.done} aria-label={`Toggle ${goal.text}`} className={cx("flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all", goal.done ? "border-lime-500 bg-lime-500 text-black" : "border-[var(--app-line)]")}>
              {goal.done && <Check className="h-3 w-3" />}
            </button>
            <span className={cx("min-w-0 flex-1 text-[12px] leading-snug", goal.done && "text-[var(--app-muted)] line-through")}>{goal.text}</span>
            <button onClick={() => remove(goal.id)} className={cx(iconBtn, "opacity-0 group-hover:opacity-100 hover:!text-rose-400")} aria-label="Remove goal">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Bookmarks (config) ────────────────────────────────────────────────── */

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
}

export function BookmarksWidget({ widget, onConfig }: WidgetProps) {
  const bookmarks: BookmarkItem[] = (widget.config?.bookmarks as BookmarkItem[]) ?? [];
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    let href = url.trim();
    if (!href) return;
    if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
    onConfig({ bookmarks: [...bookmarks, { id: `bm_${Date.now()}`, title: title.trim() || href.replace(/^https?:\/\//, "").slice(0, 40), url: href }] });
    setTitle("");
    setUrl("");
    setAdding(false);
  };
  const remove = (id: string) => onConfig({ bookmarks: bookmarks.filter((b) => b.id !== id) });

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-1 overflow-y-auto">
        {bookmarks.length === 0 && !adding && (
          <p className="flex flex-col items-center gap-1.5 py-4 text-center text-[11px] text-[var(--app-muted)]">
            <Bookmark className="h-5 w-5 text-teal-400/70" /> Save the doors you walk through often.
          </p>
        )}
        {bookmarks.map((b) => (
          <div key={b.id} className="group flex items-center gap-2 rounded-lg px-1 py-1.5 transition-colors hover:bg-[var(--app-panel-2)]">
            <Globe className="h-4 w-4 shrink-0 text-teal-400/80" />
            <a href={b.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--app-text)] hover:text-teal-300">
              {b.title}
            </a>
            <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label="Open link">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button onClick={() => remove(b.id)} className={cx(iconBtn, "opacity-0 hover:!text-rose-400 group-hover:opacity-100")} aria-label="Remove bookmark">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="mt-2 space-y-1.5 border-t border-[var(--app-line)] pt-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Label…" className={inputSm} autoFocus />
          <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="example.com" className={inputSm} />
          <div className="flex gap-1.5">
            <button onClick={add} className="btn btn-primary flex-1 !py-1.5 text-[11px]">Save</button>
            <button onClick={() => setAdding(false)} className="btn btn-ghost flex-1 !py-1.5 text-[11px]">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--app-line)] py-1.5 text-[10px] font-semibold text-[var(--app-muted)] hover:border-teal-500/40 hover:text-teal-300">
          <Plus className="h-3 w-3" /> Add bookmark
        </button>
      )}
    </div>
  );
}

/* ─── Quick Links (config) ──────────────────────────────────────────────── */

interface QuickLink {
  id: string;
  label: string;
  url: string;
  color: string;
}

const LINK_COLORS = ["#6366f1", "#06b6d4", "#22c55e", "#f97316", "#ec4899", "#eab308"];

export function QuickLinksWidget({ widget, onConfig }: WidgetProps) {
  const links: QuickLink[] = (widget.config?.links as QuickLink[]) ?? [];
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState(LINK_COLORS[0]);

  const add = () => {
    let href = url.trim();
    if (!href || !label.trim()) return;
    if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
    onConfig({ links: [...links, { id: `ql_${Date.now()}`, label: label.trim(), url: href, color }] });
    setLabel("");
    setUrl("");
    setAdding(false);
  };
  const remove = (id: string) => onConfig({ links: links.filter((l) => l.id !== id) });

  return (
    <div className="flex h-full flex-col">
      <div className="grid flex-1 content-start grid-cols-3 gap-1.5 overflow-y-auto">
        {links.map((link) => (
          <div key={link.id} className="group relative">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border border-[var(--app-line)] bg-[var(--app-panel-2)] p-2 text-center transition-all hover:-translate-y-0.5 hover:border-indigo-500/30"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: link.color }} />
              <span className="max-w-full truncate text-[10px] font-bold text-[var(--app-text)]">{link.label}</span>
            </a>
            <button onClick={() => remove(link.id)} aria-label={`Remove ${link.label}`} className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow group-hover:flex">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {!adding && (
          <button onClick={() => setAdding(true)} aria-label="Add quick link" className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--app-line)] text-[var(--app-muted)] transition-colors hover:border-indigo-500/40 hover:text-indigo-300">
            <Plus className="h-4 w-4" />
            <span className="text-[9px] font-semibold">Add</span>
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-2 space-y-1.5 border-t border-[var(--app-line)] pt-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label…" className={inputSm} autoFocus />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" className={inputSm} />
          <div className="flex items-center gap-1.5">
            {LINK_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-pressed={color === c} aria-label={`Color ${c}`} className={cx("h-5 w-5 rounded-full transition-transform hover:scale-110", color === c && "ring-2 ring-white ring-offset-2 ring-offset-[var(--app-panel)]")} style={{ background: c }} />
            ))}
            <div className="ml-auto flex gap-1">
              <button onClick={add} className="btn btn-primary !px-3 !py-1.5 text-[11px]">Add</button>
              <button onClick={() => setAdding(false)} className="btn btn-ghost !px-3 !py-1.5 text-[11px]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
