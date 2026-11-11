"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";
export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (kind: ToastKind, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((kind: ToastKind, title: string, description?: string) => {
    const id = ++toastId;
    setToasts((t) => [...t.slice(-2), { id, kind, title, description }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value: ToastContextValue = {
    toast,
    success: (t, d) => toast("success", t, d),
    error: (t, d) => toast("error", t, d),
    info: (t, d) => toast("info", t, d),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(92vw,360px)] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.97 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[var(--app-line)] bg-[var(--app-panel)] p-3 shadow-[var(--shadow-card)]"
              role="status"
            >
              <span className="mt-0.5 shrink-0">
                {t.kind === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                {t.kind === "error" && <XCircle className="h-5 w-5 text-rose-400" />}
                {t.kind === "info" && <Info className="h-5 w-5 text-indigo-400" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-[var(--app-text)]">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-snug text-[var(--app-muted)]">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 text-[var(--app-muted)] transition-colors hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)]"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
