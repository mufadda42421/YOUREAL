"use client";

import type { MediaItem, WorldWidget } from "@/lib/types";

export interface WidgetProps {
  uid: string;
  worldId: string;
  widget: WorldWidget;
  media: MediaItem[];
  accent: string;
  /** Persist a partial config object for this widget (auto-saved). */
  onConfig: (patch: Record<string, unknown>) => void;
}

export const inputSm =
  "w-full rounded-lg border border-[var(--app-line)] bg-[var(--app-panel-2)] px-2.5 py-1.5 text-[12px] text-[var(--app-text)] outline-none transition-all placeholder:text-[var(--app-muted)]/70 focus:border-indigo-500/50";

export const iconBtn =
  "rounded-lg p-1.5 text-[var(--app-muted)] transition-colors hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)]";
