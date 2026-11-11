"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  WORLD_ICONS,
  WORLD_COVERS,
  WORLD_BACKGROUNDS,
  ACCENT_COLORS,
} from "@/lib/constants";
import { cx } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface WorldFormValue {
  name: string;
  description: string;
  icon: string;
  cover: string;
  background: string;
  accent: string;
}

const DEFAULT_VALUE: WorldFormValue = {
  name: "",
  description: "",
  icon: "Sparkles",
  cover: "aurora",
  background: "nebula",
  accent: "#6366f1",
};

interface WorldFormModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  initial?: Partial<WorldFormValue>;
  submitLabel?: string;
  onSubmit: (value: WorldFormValue) => Promise<void>;
}

/** Renders a lucide icon by name, falling back to Sparkles. */
export function WorldIcon({ name, className }: { name: string; className?: string }) {
  const Icon =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ??
    Icons.Sparkles;
  return <Icon className={className} />;
}

export function coverCss(coverId: string): string {
  return WORLD_COVERS.find((c) => c.id === coverId)?.css ?? WORLD_COVERS[0].css;
}

export function backgroundCss(bgId: string): string {
  const bg = WORLD_BACKGROUNDS.find((b) => b.id === bgId);
  if (!bg) return "transparent";
  return bg.css === "transparent" ? "transparent" : bg.css;
}

export function WorldFormModal({
  open,
  onClose,
  title = "Create a world",
  initial,
  submitLabel = "Create world",
  onSubmit,
}: WorldFormModalProps) {
  const [value, setValue] = useState<WorldFormValue>(DEFAULT_VALUE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue({ ...DEFAULT_VALUE, ...initial });
      setError(null);
      setBusy(false);
    }
  }, [open, initial]);

  const set = <K extends keyof WorldFormValue>(key: K, v: WorldFormValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  const submit = async () => {
    const name = value.name.trim();
    if (name.length < 2) {
      setError("Give your world a name (at least 2 characters).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ ...value, name, description: value.description.trim() });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-lg">
      <div className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-300">
            {error}
          </p>
        )}

        {/* Live preview banner */}
        <div
          className="relative flex h-24 items-end overflow-hidden rounded-2xl border border-white/10 p-4"
          style={{ background: coverCss(value.cover) }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: value.accent }}
            >
              <WorldIcon name={value.icon} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-extrabold leading-tight text-white drop-shadow">
                {value.name.trim() || "Untitled world"}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
                {value.description.trim() ? value.description.trim().slice(0, 60) : "Your private space"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="world-name" className="label">Name</label>
          <input
            id="world-name"
            className="input"
            placeholder="Coding World, Music Corner, Travel 2027…"
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="world-desc" className="label">Description <span className="opacity-50">(optional)</span></label>
          <input
            id="world-desc"
            className="input"
            placeholder="What belongs in here?"
            value={value.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={120}
          />
        </div>

        <div>
          <span className="label">Icon</span>
          <div className="flex flex-wrap gap-1.5">
            {WORLD_ICONS.map((name) => {
              const active = value.icon === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => set("icon", name)}
                  aria-pressed={active}
                  aria-label={name}
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-lg border transition-all",
                    active
                      ? "border-indigo-500/60 bg-indigo-500/20 text-indigo-300"
                      : "border-[var(--app-line)] text-[var(--app-muted)] hover:border-indigo-500/40 hover:text-[var(--app-text)]"
                  )}
                >
                  <WorldIcon name={name} className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="label">Cover</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {WORLD_COVERS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => set("cover", c.id)}
                aria-pressed={value.cover === c.id}
                aria-label={`Cover ${c.label}`}
                title={c.label}
                className={cx(
                  "h-12 w-20 shrink-0 rounded-xl border-2 transition-all",
                  value.cover === c.id ? "border-white/80 scale-105" : "border-transparent opacity-80 hover:opacity-100"
                )}
                style={{ background: c.css }}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="label">Background</span>
            <div className="flex flex-wrap gap-1.5">
              {WORLD_BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => set("background", b.id)}
                  aria-pressed={value.background === b.id}
                  title={b.label}
                  className={cx(
                    "h-8 rounded-lg border px-2.5 text-[10px] font-semibold transition-all",
                    value.background === b.id
                      ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                      : "border-[var(--app-line)] text-[var(--app-muted)]"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Accent</span>
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("accent", c)}
                  aria-pressed={value.accent === c}
                  aria-label={`Accent ${c}`}
                  className={cx(
                    "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                    value.accent === c ? "border-white scale-110 ring-2 ring-white/30" : "border-transparent"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="button" onClick={submit} disabled={busy} className="btn btn-primary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
