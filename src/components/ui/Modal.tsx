"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, subtitle, children, maxWidth = "max-w-md" }: ModalProps) {
  // Escape to close + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Dialog"}
            className={`relative z-10 w-full ${maxWidth} max-h-[94dvh] overflow-y-auto rounded-t-2xl border border-[var(--app-line)] bg-[var(--app-panel)] p-6 shadow-[var(--shadow-card)] sm:rounded-2xl`}
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
          >
            {title ? (
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-lg font-bold tracking-tight text-[var(--app-text)]">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-[var(--app-muted)]">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[var(--app-muted)] transition-colors hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)]"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--app-muted)] transition-colors hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)]"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
