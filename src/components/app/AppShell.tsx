"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Globe2,
  FolderOpen,
  UserRound,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  UserPlus,
  Check,
  Trash2,
  Lock,
  Loader2,
  X,
} from "lucide-react";
import { LogoMark, LogoWordmark } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useApp } from "@/components/providers/AppProvider";
import { useToast } from "@/components/providers/Toast";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "My Home", icon: Home },
  { href: "/worlds", label: "My Worlds", icon: Globe2 },
  { href: "/media", label: "My Media", icon: FolderOpen },
  { href: "/profile", label: "My Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

function AccountSwitcher({ collapsed }: { collapsed: boolean }) {
  const {
    profile,
    remembered,
    switchAccount,
    prepareAddAccount,
    forgetAccountDevice,
    signOutActive,
    activeUid,
  } = useApp();
  const { success, error } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [confirmForget, setConfirmForget] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setConfirmForget(null);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const others = remembered.filter((a) => a.uid !== activeUid);

  const handleSwitch = async (uid: string) => {
    setSwitchingTo(uid);
    const result = await switchAccount(uid);
    setSwitchingTo(null);
    if (result === "ready") {
      success("Switched account", "Welcome back.");
      setOpen(false);
      router.push("/dashboard");
    } else if (result === "locked") {
      success("Enter your PIN", "This account is protected.");
      setOpen(false);
    } else {
      // Session no longer valid on this device — ask for credentials.
      prepareAddAccount();
      setOpen(false);
      router.push("/?auth=signin");
      error("Session expired", "Please sign in to that account again.");
    }
  };

  const handleForget = async (uid: string) => {
    await forgetAccountDevice(uid);
    setConfirmForget(null);
    success("Removed from this device", "The account will need to sign in again here.");
  };

  if (!profile) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "flex w-full items-center gap-2.5 rounded-xl border border-transparent p-1.5 text-left transition-all hover:border-[var(--app-line)] hover:bg-[var(--app-panel-2)]",
          collapsed && "justify-center"
        )}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Avatar name={profile.fullName} src={profile.avatarUrl} size={collapsed ? 36 : 38} />
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold leading-tight text-[var(--app-text)]">
              {profile.preferredName || profile.fullName}
            </span>
            <span className="block truncate text-[10px] text-[var(--app-muted)]">{profile.email}</span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-[calc(100%+10px)] left-0 z-50 w-72 overflow-hidden rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] shadow-[var(--shadow-card)]"
            role="menu"
          >
            <div className="border-b border-[var(--app-line)] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                Accounts on this device
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              <div className="flex items-center gap-2.5 rounded-xl bg-indigo-500/10 p-2 ring-1 ring-indigo-500/40">
                <Avatar name={profile.fullName} src={profile.avatarUrl} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-xs font-bold text-[var(--app-text)]">
                    {profile.preferredName || profile.fullName}
                    {profile.pin?.enabled && <Lock className="h-3 w-3 text-indigo-400" />}
                  </p>
                  <p className="truncate text-[10px] text-[var(--app-muted)]">{profile.email}</p>
                </div>
                <Check className="h-4 w-4 shrink-0 text-indigo-400" />
              </div>

              {others.map((acct) => (
                <div
                  key={acct.uid}
                  className="group mt-1 flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-[var(--app-panel-2)]"
                >
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    onClick={() => handleSwitch(acct.uid)}
                    disabled={switchingTo !== null}
                  >
                    <Avatar name={acct.displayName} src={acct.photoURL} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-xs font-bold text-[var(--app-text)]">
                        {acct.displayName}
                        {acct.pinEnabled && <Lock className="h-3 w-3 text-amber-400" />}
                      </p>
                      <p className="truncate text-[10px] text-[var(--app-muted)]">{acct.email}</p>
                    </div>
                    {switchingTo === acct.uid && <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />}
                  </button>
                  {confirmForget === acct.uid ? (
                    <button
                      onClick={() => handleForget(acct.uid)}
                      className="shrink-0 rounded-lg bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-500/25"
                    >
                      Remove?
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmForget(acct.uid)}
                      aria-label={`Remove ${acct.displayName} from this device`}
                      className="shrink-0 rounded-lg p-1.5 text-[var(--app-muted)] opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 focus:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--app-line)] p-2">
              <button
                onClick={() => {
                  prepareAddAccount("signup");
                  setOpen(false);
                  // ProtectedShell's route guard performs the navigation,
                  // landing on the signup modal via the consumed intent.
                }}
                className="flex w-full items-center gap-2.5 rounded-xl p-2 text-xs font-semibold text-[var(--app-text)] transition-colors hover:bg-[var(--app-panel-2)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-[var(--app-line)] text-[var(--app-muted)]">
                  <UserPlus className="h-4 w-4" />
                </span>
                Add another account
              </button>
              <button
                onClick={() => void signOutActive()}
                className="flex w-full items-center gap-2.5 rounded-xl p-2 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10">
                  <LogOut className="h-4 w-4" />
                </span>
                Sign out of {profile.preferredName || "this account"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("you-sidebar-collapsed") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      try {
        localStorage.setItem("you-sidebar-collapsed", v ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !v;
    });
  };

  const sidebarContent = (isCollapsed: boolean, onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cx("flex h-16 shrink-0 items-center gap-2.5 border-b border-[var(--app-line)] px-4", isCollapsed && "justify-center px-2")}>
        <LogoMark size={32} />
        {!isCollapsed && <LogoWordmark />}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Primary">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cx(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                isCollapsed && "justify-center px-0 py-3",
                active
                  ? "text-indigo-300"
                  : "text-[var(--app-muted)] hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)]"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {active && (
                <motion.span
                  layoutId={isCollapsed ? "nav-active-collapsed" : "nav-active"}
                  className="absolute inset-0 rounded-xl border border-indigo-500/30 bg-indigo-500/10"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              )}
              <Icon className="relative h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              {!isCollapsed && <span className="relative">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={toggleCollapsed}
        className="mx-3 hidden shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--app-line)] py-2 text-[11px] font-semibold text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)] lg:flex"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
      </button>

      {/* Account */}
      <div className="shrink-0 border-t border-[var(--app-line)] p-3">
        <AccountSwitcher collapsed={isCollapsed} />
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[var(--app-bg)]">
      {/* Desktop sidebar */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-[var(--app-line)] bg-[var(--app-panel)] transition-[width] duration-300 ease-in-out lg:block",
          collapsed ? "w-[76px]" : "w-[248px]"
        )}
      >
        {sidebarContent(collapsed)}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--app-line)] bg-[var(--app-panel)]/90 px-4 backdrop-blur-lg lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-lg p-2 text-[var(--app-muted)] hover:text-[var(--app-text)]"
          aria-label="Open navigation"
        >
          <LogoMark size={28} />
          <LogoWordmark className="!text-lg" />
        </button>
        <MobileAvatarButton />
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="absolute inset-y-0 left-0 w-[270px] border-r border-[var(--app-line)] bg-[var(--app-panel)]"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-2 text-[var(--app-muted)] hover:text-[var(--app-text)]"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent(false, () => setMobileOpen(false))}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main
        className={cx(
          "min-h-dvh transition-[margin] duration-300 ease-in-out",
          collapsed ? "lg:ml-[76px]" : "lg:ml-[248px]"
        )}
      >
        {children}
      </main>
    </div>
  );
}

function MobileAvatarButton() {
  const { profile, status } = useApp();
  if (status !== "ready" || !profile) return null;
  return (
    <Link href="/profile" aria-label="My profile">
      <Avatar name={profile.fullName} src={profile.avatarUrl} size={34} />
    </Link>
  );
}
