"use client";

import { useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { WIDGET_LIBRARY } from "./widget-registry";
import { cx } from "@/lib/utils";
import type { WidgetType } from "@/lib/types";

interface WidgetLibraryProps {
  open: boolean;
  onClose: () => void;
  existing: WidgetType[];
  onAdd: (type: WidgetType) => Promise<void> | void;
}

export function WidgetLibrary({ open, onClose, existing, onAdd }: WidgetLibraryProps) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<WidgetType | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = WIDGET_LIBRARY.filter(
    (w) =>
      !q ||
      w.title.toLowerCase().includes(q) ||
      w.description.toLowerCase().includes(q)
  );

  const handleAdd = async (type: WidgetType) => {
    setAdding(type);
    try {
      await onAdd(type);
      onClose();
    } finally {
      setAdding(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Widget library" subtitle="15 fully-functional widgets. Add, then drag into place." maxWidth="max-w-2xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search widgets…"
          className="input !pl-10"
          aria-label="Search widgets"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label="Clear search">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 grid max-h-[52vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
        {filtered.map((w) => {
          const already = existing.includes(w.type);
          return (
            <button
              key={w.type}
              onClick={() => handleAdd(w.type)}
              disabled={adding === w.type}
              className="group flex items-start gap-3 rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel-2)] p-3 text-left transition-all hover:border-indigo-500/40 hover:bg-indigo-500/[0.06]"
            >
              <span className={cx("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", w.tint)}>
                <w.Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-[var(--app-text)]">{w.title}</span>
                  <Plus className="h-4 w-4 shrink-0 text-[var(--app-muted)] transition-all group-hover:rotate-90 group-hover:text-indigo-400" />
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--app-muted)]">
                  {already ? "Already added — add another" : w.description}
                </span>
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-[var(--app-muted)]">
            Nothing matches “{query}”.
          </p>
        )}
      </div>
    </Modal>
  );
}
