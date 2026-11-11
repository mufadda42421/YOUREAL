"use client";

import { forwardRef, type ReactNode } from "react";
import { GripVertical, MoreHorizontal, Trash2, Check } from "lucide-react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { cx } from "@/lib/utils";
import type { WidgetSize } from "@/lib/types";

export const SIZE_LABEL: Record<WidgetSize, string> = {
  sm: "Small · 1/3",
  md: "Medium · half",
  lg: "Large · 2/3",
  xl: "Full width",
};

interface WidgetShellProps {
  id: string;
  title: string;
  size: WidgetSize;
  accent: string;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  setSize: (size: WidgetSize) => void;
  onRemove: () => void;
  children: ReactNode;
  isDragging?: boolean;
}

const SIZE_OPTIONS: WidgetSize[] = ["sm", "md", "lg", "xl"];

/** Chrome around every widget: drag handle, title, settings, remove. */
export const WidgetShell = forwardRef<HTMLDivElement, WidgetShellProps>(function WidgetShell(
  {
    id,
    title,
    size,
    accent,
    dragAttributes,
    dragListeners,
    setSize,
    onRemove,
    children,
    isDragging,
  },
  ref
) {
  return (
    <div
      ref={ref}
      data-widget-id={id}
      className={cx(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] shadow-[var(--shadow-card)] transition-shadow",
        isDragging && "z-20 rotate-[0.5deg] shadow-2xl ring-2 ring-indigo-500/50"
      )}
    >
      <div
        className="flex shrink-0 items-center gap-1 border-b border-[var(--app-line)] px-2 py-1.5"
        style={{ background: `linear-gradient(90deg, ${accent}14, transparent 60%)` }}
      >
        <button
          {...dragAttributes}
          {...dragListeners}
          aria-label="Drag to rearrange widget"
          className="cursor-grab touch-none rounded-lg p-1.5 text-[var(--app-muted)] transition-colors hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)] active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
          {title}
        </span>
        <Dropdown
          trigger={
            <span className="rounded-lg p-1.5 text-[var(--app-muted)] transition-colors hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)]">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          }
        >
          <p className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--app-muted)]">
            Widget size
          </p>
          {SIZE_OPTIONS.map((s) => (
            <DropdownItem
              key={s}
              label={SIZE_LABEL[s]}
              icon={s === size ? Check : undefined}
              onClick={() => setSize(s)}
            />
          ))}
          <div className="my-1 border-t border-[var(--app-line)]" />
          <DropdownItem icon={Trash2} label="Remove widget" danger onClick={onRemove} />
        </Dropdown>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  );
});
