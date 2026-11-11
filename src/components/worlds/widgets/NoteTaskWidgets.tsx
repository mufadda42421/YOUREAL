"use client";

import { useCallback, useEffect, useState } from "react";
import { Pin, Plus, Trash2, Check, Loader2 } from "lucide-react";
import {
  listNotes,
  upsertNote,
  deleteNote,
  listTasks,
  addTask,
  updateTask,
  deleteTask,
  listJournal,
  addJournalEntry,
  deleteJournalEntry,
} from "@/lib/firebase/worlds";
import { MOODS } from "@/lib/constants";
import { timeAgo, cx } from "@/lib/utils";
import { inputSm, iconBtn, type WidgetProps } from "./common";
import type { NoteItem, TaskItem, JournalEntry } from "@/lib/types";

/* ─── Notes ─────────────────────────────────────────────────────────────── */

export function NotesWidget({ uid, worldId }: WidgetProps) {
  const [notes, setNotes] = useState<NoteItem[] | null>(null);
  const [draft, setDraft] = useState("");

  const load = useCallback(() => listNotes(uid, worldId).then(setNotes).catch(() => setNotes([])), [uid, worldId]);
  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    const ts = new Date().toISOString();
    await upsertNote(uid, worldId, { title: text.slice(0, 60), body: text, pinned: false, createdAt: ts, updatedAt: ts });
    await load();
  };

  const togglePin = async (note: NoteItem) => {
    await upsertNote(uid, worldId, { ...note, pinned: !note.pinned });
    await load();
  };

  const remove = async (note: NoteItem) => {
    await deleteNote(uid, worldId, note.id);
    await load();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Capture a thought…"
          className={inputSm}
          aria-label="New note"
        />
        <button onClick={add} className="rounded-lg bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-500" aria-label="Add note">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {notes === null && <div className="skeleton h-full w-full rounded-xl" />}
        {notes?.length === 0 && <EmptyLine text="Nothing captured yet. Your inbox is quiet." />}
        {notes?.map((note) => (
          <div key={note.id} className="group flex items-start gap-2 rounded-xl border border-[var(--app-line)] bg-[var(--app-panel-2)] p-2.5">
            <p className="min-w-0 flex-1 whitespace-pre-wrap text-[12px] leading-snug text-[var(--app-text)]">{note.body}</p>
            <div className="flex shrink-0 flex-col">
              <button onClick={() => togglePin(note)} className={iconBtn} aria-label={note.pinned ? "Unpin note" : "Pin note"}>
                <Pin className={cx("h-3.5 w-3.5", note.pinned && "fill-amber-400 text-amber-400")} />
              </button>
              <button onClick={() => remove(note)} className={cx(iconBtn, "hover:!text-rose-400")} aria-label="Delete note">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tasks ─────────────────────────────────────────────────────────────── */

export function TasksWidget({ uid, worldId }: WidgetProps) {
  const [tasks, setTasks] = useState<TaskItem[] | null>(null);
  const [draft, setDraft] = useState("");

  const load = useCallback(() => listTasks(uid, worldId).then(setTasks).catch(() => setTasks([])), [uid, worldId]);
  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await addTask(uid, worldId, text);
    await load();
  };

  const toggle = async (task: TaskItem) => {
    setTasks((prev) => (prev ?? []).map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    await updateTask(uid, worldId, task.id, { done: !task.done }).catch(load);
  };

  const remove = async (task: TaskItem) => {
    setTasks((prev) => (prev ?? []).filter((t) => t.id !== task.id));
    await deleteTask(uid, worldId, task.id).catch(load);
  };

  const open = tasks?.filter((t) => !t.done).length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task…"
          className={inputSm}
          aria-label="New task"
        />
        <button onClick={add} className="rounded-lg bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-500" aria-label="Add task">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {tasks === null && <div className="skeleton h-full w-full rounded-xl" />}
        {tasks?.length === 0 && <EmptyLine text="Zero open loops. Everything is handled." />}
        {tasks?.map((task) => (
          <label key={task.id} className="group flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-[var(--app-panel-2)]">
            <input type="checkbox" className="peer sr-only" checked={task.done} onChange={() => toggle(task)} />
            <span className={cx(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
              task.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--app-line)] peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500"
            )}>
              {task.done && <Check className="h-3 w-3" />}
            </span>
            <span className={cx("min-w-0 flex-1 text-[12px] leading-snug", task.done ? "text-[var(--app-muted)] line-through" : "text-[var(--app-text)]")}>
              {task.text}
            </span>
            <button onClick={(e) => { e.preventDefault(); remove(task); }} className={cx(iconBtn, "opacity-0 group-hover:opacity-100 hover:!text-rose-400")} aria-label="Delete task">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </label>
        ))}
      </div>
      {tasks && tasks.length > 0 && (
        <p className="border-t border-[var(--app-line)] pt-1.5 text-right font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--app-muted)]">
          {open} open · {tasks.length - open} done
        </p>
      )}
    </div>
  );
}

/* ─── Journal ───────────────────────────────────────────────────────────── */

export function JournalWidget({ uid, worldId }: WidgetProps) {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string>("calm");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => listJournal(uid, worldId).then(setEntries).catch(() => setEntries([])), [uid, worldId]);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    await addJournalEntry(uid, worldId, { title: title.trim() || "Untitled entry", body: text, mood }).catch(() => {});
    setTitle("");
    setBody("");
    setComposing(false);
    setBusy(false);
    await load();
  };

  const remove = async (entry: JournalEntry) => {
    await deleteJournalEntry(uid, worldId, entry.id);
    await load();
  };

  if (composing) {
    return (
      <div className="flex h-full flex-col gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title…" className={inputSm} autoFocus />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's actually happening in you?" rows={4} className={cx(inputSm, "min-h-0 flex-1 resize-none")} />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {MOODS.slice(0, 5).map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                title={m.label}
                aria-pressed={mood === m.id}
                className={cx("flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-all", mood === m.id ? "scale-110 bg-indigo-500/20 ring-1 ring-indigo-500/50" : "opacity-60 hover:opacity-100")}
              >
                {m.emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setComposing(false)} className="btn btn-ghost !px-3 !py-1.5 text-[11px]">Cancel</button>
            <button onClick={save} disabled={busy || !body.trim()} className="btn btn-primary !px-3 !py-1.5 text-[11px]">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <button onClick={() => setComposing(true)} className="btn btn-subtle !py-1.5 text-[11px]">
        <Plus className="h-3.5 w-3.5" /> New entry
      </button>
      <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {entries === null && <div className="skeleton h-full w-full rounded-xl" />}
        {entries?.length === 0 && <EmptyLine text="Your private pages are waiting." />}
        {entries?.map((entry) => (
          <div key={entry.id} className="group rounded-xl border border-[var(--app-line)] bg-[var(--app-panel-2)] p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--app-text)]">
                  <span aria-hidden>{MOODS.find((m) => m.id === entry.mood)?.emoji}</span>
                  <span className="truncate">{entry.title}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-[11px] leading-snug text-[var(--app-muted)] line-clamp-2">{entry.body}</p>
              </div>
              <button onClick={() => remove(entry)} className={cx(iconBtn, "shrink-0 opacity-0 group-hover:opacity-100 hover:!text-rose-400")} aria-label="Delete entry">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-right font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--app-muted)]/70">{timeAgo(entry.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Shared ────────────────────────────────────────────────────────────── */

function EmptyLine({ text }: { text: string }) {
  return <p className="px-2 py-6 text-center text-[11px] text-[var(--app-muted)]">{text}</p>;
}
