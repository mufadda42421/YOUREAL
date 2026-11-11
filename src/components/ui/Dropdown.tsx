"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

/** Minimal accessible popover menu. Closes on outside click or Escape. */
export function Dropdown({ trigger, children, align = "right", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block ${className ?? ""}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} className="contents">
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            role="menu"
            className={`absolute z-40 mt-2 min-w-44 overflow-hidden rounded-xl border border-[var(--app-line)] bg-[var(--app-panel)] p-1 shadow-[var(--shadow-card)] ${
              align === "right" ? "right-0" : "left-0"
            }`}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-colors ${
        danger
          ? "text-rose-400 hover:bg-rose-500/10"
          : "text-[var(--app-text)] hover:bg-[var(--app-panel-2)]"
      }`}
    >
      {Icon && <Icon className="h-4 w-4 opacity-80" />}
      {label}
    </button>
  );
}
