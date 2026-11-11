"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
  Trash2,
  Loader2,
  LogOut,
  Download,
  Sun,
  Moon,
  Monitor,
  Check,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from "firebase/auth";
import { useApp } from "@/components/providers/AppProvider";
import { useToast } from "@/components/providers/Toast";
import { ChipEditor } from "@/components/ui/ChipEditor";
import { updateProfile, fetchProfile } from "@/lib/firebase/profile";
import { deleteAllUserData } from "@/lib/firebase/profile";
import {
  listWorlds,
  listWidgets,
  listNotes,
  listTasks,
  listJournal,
  listMedia,
  listFolders,
} from "@/lib/firebase/worlds";
import { getAccountAuth } from "@/lib/firebase/config";
import {
  INTEREST_SUGGESTIONS,
  AGE_RANGES,
  LANGUAGES,
  COMMUNICATION_STYLES,
  RESPONSE_LENGTHS,
} from "@/lib/constants";
import { validatePassword, validatePin } from "@/lib/validation";
import { cx } from "@/lib/utils";
import type { ThemePreference, UserProfile } from "@/lib/types";

const TABS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "interests", label: "Interests", icon: Sparkles },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "account", label: "Account", icon: Trash2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const { profile, user } = useApp();
  const [tab, setTab] = useState<TabId>("profile");

  if (!profile || !user) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="skeleton h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-indigo-400">Settings</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[var(--app-text)] sm:text-4xl">Tune your world</h1>
      <p className="mt-1.5 text-sm text-[var(--app-muted)]">Everything here saves straight to your private profile.</p>

      {/* Tab bar */}
      <div role="tablist" aria-label="Settings sections" className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cx(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
              tab === id
                ? "bg-indigo-600 text-white shadow"
                : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === "profile" && <ProfileTab />}
        {tab === "interests" && <InterestsTab />}
        {tab === "preferences" && <PreferencesTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "account" && <AccountTab />}
      </div>
    </div>
  );
}

/* ───────────────────────── shared bits ───────────────────────── */

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[var(--app-line)] bg-[var(--app-panel)] p-5 sm:p-6">
      <h2 className="text-sm font-bold text-[var(--app-text)]">{title}</h2>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SaveBar({ saving, onSave, dirtyNote }: { saving: boolean; onSave: () => void; dirtyNote?: string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">{dirtyNote ?? "Saves to your private profile"}</p>
      <button onClick={onSave} disabled={saving} className="btn btn-primary !py-2 text-xs">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Save changes
      </button>
    </div>
  );
}

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  // Wrapping label → clicking the label text focuses the control inside (WCAG 2.1 compliant).
  return (
    <label className="block">
      <span className="label">
        {label} {optional && <span className="opacity-50">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

/** Persist a set of profile keys, update local state, toast the outcome. */
function useProfileSaver() {
  const { user, applyProfile, refreshProfile } = useApp();
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);

  const save = async (patch: Partial<UserProfile>, label = "Saved") => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.uid, patch);
      applyProfile(patch);
      await refreshProfile();
      success(label, "Your world just learned something new about you.");
    } catch {
      error("Could not save", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return { save, saving };
}

/* ───────────────────────── Profile tab ───────────────────────── */

function ProfileTab() {
  const { profile } = useApp();
  const { save, saving } = useProfileSaver();

  const [fullName, setFullName] = useState(profile!.fullName);
  const [preferredName, setPreferredName] = useState(profile!.preferredName);
  const [ageRange, setAgeRange] = useState(profile!.ageRange);
  const [location, setLocation] = useState(profile!.location);
  const [occupation, setOccupation] = useState(profile!.occupation);
  const [bio, setBio] = useState(profile!.bio);

  return (
    <Section title="About you" hint="The identity behind every personalized corner of YOU.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Preferred name">
          <input className="input" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder="What should YOU call you?" />
        </Field>
        <Field label="Age range" optional>
          <select className="input" value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
            <option value="">Prefer not to say</option>
            {AGE_RANGES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Location" optional>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lisbon, Portugal" />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="What do you do?" optional>
          <input className="input" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Student, designer, founder…" />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Short introduction" optional>
          <textarea rows={3} maxLength={280} className="input resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A night owl who paints, prototypes and overthinks breakfast…" />
          <p className="mt-1 text-right font-mono text-[10px] text-[var(--app-muted)]">{bio.length}/280</p>
        </Field>
      </div>
      <Field label="Email">
        <input className="input cursor-not-allowed opacity-60" value={profile!.email} readOnly disabled aria-readonly />
      </Field>
      <SaveBar saving={saving} onSave={() =>
        save(
          {
            fullName: fullName.trim(),
            preferredName: preferredName.trim() || fullName.trim().split(" ")[0],
            ageRange,
            location: location.trim(),
            occupation: occupation.trim(),
            bio: bio.trim(),
          },
          "Profile updated"
        )
      } />
    </Section>
  );
}

/* ───────────────────────── Interests tab ──────────────────────── */

function InterestsTab() {
  const { profile } = useApp();
  const { save, saving } = useProfileSaver();
  const [interests, setInterests] = useState<string[]>(profile!.interests);

  const toggle = (label: string) =>
    setInterests((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));

  return (
    <Section title="Your interests" hint="These shape what YOU surfaces, suggests and celebrates.">
      <div className="flex flex-wrap gap-2">
        {INTEREST_SUGGESTIONS.map((label) => (
          <button key={label} onClick={() => toggle(label)} aria-pressed={interests.includes(label)} className={cx("chip", interests.includes(label) && "chip-active")}>
            {interests.includes(label) && <Check className="h-3 w-3" />}
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <ChipEditor label="Your own" placeholder="Mycology, speedcubing…" list={interests.filter((i) => !(INTEREST_SUGGESTIONS as readonly string[]).includes(i))}
          setList={(custom) => setInterests([...interests.filter((i) => (INTEREST_SUGGESTIONS as readonly string[]).includes(i)), ...custom])} />
      </div>
      <SaveBar saving={saving} onSave={() => save({ interests }, "Interests updated")} />
    </Section>
  );
}

/* ───────────────────────── Preferences tab ────────────────────── */

function PreferencesTab() {
  const { profile, applyProfile } = useApp();
  const { save, saving } = useProfileSaver();
  const { success, error } = useToast();
  const prefs = profile!.preferences;

  const [language, setLanguage] = useState(prefs.language);
  const [communicationStyle, setCommunicationStyle] = useState(prefs.communicationStyle);
  const [responseLength, setResponseLength] = useState(prefs.responseLength);
  const [topics, setTopics] = useState<string[]>(prefs.topics);
  const [dislikes, setDislikes] = useState<string[]>(prefs.dislikes);
  const [goals, setGoals] = useState<string[]>(prefs.goals);

  const applyThemeNow = async (theme: ThemePreference) => {
    applyProfile({ preferences: { ...prefs, theme } });
    try {
      await updateProfile(profile!.uid, { preferences: { ...prefs, theme } });
      success("Theme applied", theme === "system" ? "Following your system setting." : `${theme[0].toUpperCase() + theme.slice(1)} mode it is.`);
    } catch {
      error("Could not save theme", "Check your connection.");
    }
  };

  const themeOptions = [
    { id: "light" as const, label: "Light", Icon: Sun },
    { id: "dark" as const, label: "Dark", Icon: Moon },
    { id: "system" as const, label: "System", Icon: Monitor },
  ];

  return (
    <div className="space-y-4">
      <Section title="Appearance" hint="Applies instantly, everywhere in the app.">
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => applyThemeNow(id)}
              aria-pressed={prefs.theme === id}
              className={cx(
                "flex flex-col items-center gap-2 rounded-2xl border py-5 transition-all",
                prefs.theme === id
                  ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/40"
                  : "border-[var(--app-line)] text-[var(--app-muted)] hover:border-indigo-500/30 hover:text-[var(--app-text)]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-bold">{label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Language & voice" hint="How YOU talks with you.">
        <Field label="Preferred language">
          <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>

        <div className="mt-4">
          <span className="label">Communication style</span>
          <div className="flex flex-wrap gap-2">
            {COMMUNICATION_STYLES.map((s) => (
              <button key={s} onClick={() => setCommunicationStyle(s)} aria-pressed={communicationStyle === s} className={cx("chip", communicationStyle === s && "chip-active")}>{s}</button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <span className="label">Response length</span>
          <div className="flex gap-1 rounded-xl border border-[var(--app-line)] bg-[var(--app-panel-2)] p-1">
            {RESPONSE_LENGTHS.map((r) => (
              <button
                key={r}
                onClick={() => setResponseLength(r)}
                aria-pressed={responseLength === r}
                className={cx(
                  "flex-1 rounded-lg py-2 text-[11px] font-semibold transition-all",
                  responseLength === r ? "bg-indigo-600 text-white shadow" : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <ChipEditor label="Topics you love" placeholder="Generative art, space, memory…" list={topics} setList={setTopics} />
          <ChipEditor label="Things you dislike" placeholder="Clickbait, meetings…" list={dislikes} setList={setDislikes} />
          <ChipEditor label="Personal goals" placeholder="Run a 10k, write a novel…" list={goals} setList={setGoals} />
        </div>

        <SaveBar
          saving={saving}
          onSave={() =>
            save(
              { preferences: { ...prefs, language, communicationStyle, responseLength, topics, dislikes, goals } },
              "Preferences saved"
            )
          }
        />
      </Section>
    </div>
  );
}

/* ───────────────────────── Security tab ───────────────────────── */

function SecurityTab() {
  const { user, profile, enablePin, disablePin, changePin, signOutActive } = useApp();
  const { success, error } = useToast();
  const uid = user?.uid ?? "";

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // PIN state
  const [pinMode, setPinMode] = useState<"idle" | "setup" | "change" | "disable">("idle");
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [nextPinConfirm, setNextPinConfirm] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const pinEnabled = Boolean(profile?.pin?.enabled);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    const validationError = validatePassword(newPassword);
    if (validationError) return setPwError(validationError);
    if (newPassword !== confirmPassword) return setPwError("New passwords do not match.");
    if (!user?.email) return setPwError("Missing account email.");
    setPwBusy(true);
    try {
      const auth = getAccountAuth(uid);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, newPassword);
      success("Password changed", "You'll need it next time you sign in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e2) {
      const code = (e2 as { code?: string })?.code;
      setPwError(
        code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/invalid-login-credentials"
          ? "Your current password is incorrect."
          : "Could not change password. Try again."
      );
    } finally {
      setPwBusy(false);
    }
  };

  const resetPinForm = () => {
    setCurrentPin("");
    setNextPin("");
    setNextPinConfirm("");
    setPinError(null);
    setPinMode("idle");
  };

  const submitPin = async () => {
    setPinError(null);
    if (pinMode === "setup") {
      const err = validatePin(nextPin);
      if (err) return setPinError(err);
      if (nextPin !== nextPinConfirm) return setPinError("PINs do not match.");
      setPinBusy(true);
      const result = await enablePin(nextPin);
      setPinBusy(false);
      if (!result.ok) return setPinError(result.error ?? "Could not enable PIN.");
      success("PIN enabled", "This account now asks for a PIN on shared devices.");
      return resetPinForm();
    }
    if (pinMode === "change") {
      if (validatePin(currentPin)) return setPinError("Current PIN must be 4 digits.");
      const err = validatePin(nextPin);
      if (err) return setPinError(err);
      if (nextPin !== nextPinConfirm) return setPinError("New PINs do not match.");
      setPinBusy(true);
      const result = await changePin(currentPin, nextPin);
      setPinBusy(false);
      if (!result.ok) return setPinError(result.error ?? "Could not change PIN.");
      success("PIN changed", "Use the new PIN next time.");
      return resetPinForm();
    }
    if (pinMode === "disable") {
      if (validatePin(currentPin)) return setPinError("Current PIN must be 4 digits.");
      setPinBusy(true);
      const result = await disablePin(currentPin);
      setPinBusy(false);
      if (!result.ok) return setPinError(result.error ?? "Could not disable PIN.");
      success("PIN disabled", "Password alone unlocks this account now.");
      return resetPinForm();
    }
  };

  return (
    <div className="space-y-4">
      {/* Change password */}
      <Section title="Password" hint="Re-authenticated securely with Firebase — your current password is required.">
        <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
          {pwError && (
            <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-300 sm:col-span-2">
              {pwError}
            </p>
          )}
          <div className="sm:col-span-2">
            <Field label="Current password">
              <input type={showPw ? "text" : "password"} autoComplete="current-password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </Field>
          </div>
          <Field label="New password">
            <div className="relative">
              <input type={showPw ? "text" : "password"} autoComplete="new-password" className="input pr-10" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="8+ chars, letters & numbers" required />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label={showPw ? "Hide passwords" : "Show passwords"}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm new password">
            <input type={showPw ? "text" : "password"} autoComplete="new-password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pwBusy} className="btn btn-primary !py-2 text-xs">
              {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Change password
            </button>
          </div>
        </form>
      </Section>

      {/* PIN management */}
      <Section title="PIN protection" hint="An optional 4-digit layer for shared devices. Never a replacement for your password.">
        {pinMode === "idle" ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={cx("flex h-11 w-11 items-center justify-center rounded-xl", pinEnabled ? "bg-emerald-500/15 text-emerald-400" : "bg-[var(--app-panel-2)] text-[var(--app-muted)]")}>
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--app-text)]">{pinEnabled ? "PIN is enabled" : "No PIN set"}</p>
                <p className="text-[10px] text-[var(--app-muted)]">{pinEnabled ? "Required when switching into this account on this device." : "Recommended if others use this device."}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {pinEnabled ? (
                <>
                  <button onClick={() => setPinMode("change")} className="btn btn-ghost !py-2 text-xs">Change PIN</button>
                  <button onClick={() => setPinMode("disable")} className="btn btn-danger !py-2 text-xs">Disable</button>
                </>
              ) : (
                <button onClick={() => setPinMode("setup")} className="btn btn-primary !py-2 text-xs">
                  <Lock className="h-4 w-4" /> Enable PIN
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel-2)] p-4">
            <p className="text-xs font-bold text-[var(--app-text)]">
              {pinMode === "setup" && "Choose your 4-digit PIN"}
              {pinMode === "change" && "Change your PIN"}
              {pinMode === "disable" && "Verify to disable PIN"}
            </p>
            {pinError && <p role="alert" className="mt-2 text-[11px] font-medium text-rose-400">{pinError}</p>}
            <div className="mt-3 flex flex-wrap gap-3">
              {(pinMode === "change" || pinMode === "disable") && (
                <input type="password" inputMode="numeric" maxLength={4} autoComplete="off" autoFocus placeholder="Current PIN" value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))} className="input w-36 text-center font-mono tracking-[0.5em]" aria-label="Current PIN" />
              )}
              {pinMode !== "disable" && (
                <>
                  <input type="password" inputMode="numeric" maxLength={4} autoComplete="off" placeholder="New PIN" value={nextPin} onChange={(e) => setNextPin(e.target.value.replace(/\D/g, "").slice(0, 4))} className="input w-36 text-center font-mono tracking-[0.5em]" aria-label="New PIN" />
                  <input type="password" inputMode="numeric" maxLength={4} autoComplete="off" placeholder="Confirm" value={nextPinConfirm} onChange={(e) => setNextPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))} onKeyDown={(e) => e.key === "Enter" && submitPin()} className="input w-36 text-center font-mono tracking-[0.5em]" aria-label="Confirm new PIN" />
                </>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={submitPin} disabled={pinBusy} className="btn btn-primary !py-2 text-xs">
                {pinBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {pinMode === "disable" ? "Disable PIN" : "Save PIN"}
              </button>
              <button onClick={resetPinForm} className="btn btn-ghost !py-2 text-xs">Cancel</button>
            </div>
          </div>
        )}
        <button onClick={() => void signOutActive()} className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]">
          <LogOut className="h-3.5 w-3.5" /> Signed in on this device as {user?.email} — sign out here
        </button>
      </Section>
    </div>
  );
}

/* ───────────────────────── Account tab ────────────────────────── */

function AccountTab() {
  const { user, signOutActive, forgetAccountDevice } = useApp();
  const { success, error } = useToast();
  const router = useRouter();
  const uid = user?.uid ?? "";

  const [exporting, setExporting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const exportData = async () => {
    setExporting(true);
    try {
      const [worlds, media, folders] = await Promise.all([listWorlds(uid), listMedia(uid), listFolders(uid)]);
      const worldsFull = await Promise.all(
        worlds.map(async (w) => ({
          ...w,
          widgets: await listWidgets(uid, w.id),
          notes: await listNotes(uid, w.id),
          tasks: await listTasks(uid, w.id),
          journal: await listJournal(uid, w.id),
        }))
      );
      const payload = {
        exportedAt: new Date().toISOString(),
        account: { uid },
        profile: await fetchProfile(uid),
        worlds: worldsFull,
        media,
        folders,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `you-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success("Export ready", "Your entire world, as one JSON file.");
    } catch {
      error("Export failed", "Check your connection and try again.");
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    if (confirmPhrase.trim().toUpperCase() !== "DELETE") {
      setDeleteError('Type DELETE (all caps) to confirm.');
      return;
    }
    if (!user?.email) return setDeleteError("Missing account email.");
    setDeleteBusy(true);
    try {
      const auth = getAccountAuth(uid);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("session-expired");
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(currentUser, credential);
      await deleteAllUserData(uid);
      await deleteUser(currentUser);
      await forgetAccountDevice(uid);
      success("Account deleted", "Everything was removed. Take care out there.");
      router.replace("/");
    } catch (e2) {
      const code = (e2 as { code?: string })?.code;
      setDeleteError(
        code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/invalid-login-credentials"
          ? "That password is incorrect."
          : code === "auth/requires-recent-login"
          ? "Please sign out and back in, then try deletion again."
          : "Deletion failed — some data may remain. Try again in a moment."
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Section title="Export your data" hint="A complete, portable copy — profile, worlds, widgets, notes, tasks, journal, media metadata, folders.">
        <button onClick={exportData} disabled={exporting} className="btn btn-ghost !py-2 text-xs">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download everything (.json)
        </button>
      </Section>

      <Section title="Sign out" hint="Ends the session on this device. Your data stays safe in your account.">
        <button onClick={() => void signOutActive()} className="btn btn-ghost !py-2 text-xs">
          <LogOut className="h-4 w-4" /> Sign out of this account
        </button>
      </Section>

      <section className="rounded-3xl border border-rose-500/25 bg-rose-500/[0.04] p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-rose-300">
          <Trash2 className="h-4 w-4" /> Danger zone
        </h2>
        <p className="mt-1 text-[11px] leading-relaxed text-rose-200/70">
          Deleting your account removes your profile, worlds, widgets, notes, tasks, journal entries, media files and
          folders — permanently, from our servers. This cannot be undone.
        </p>
        <form onSubmit={deleteAccount} className="mt-4 space-y-3">
          {deleteError && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-300">{deleteError}</p>}
          <Field label="Confirm with your password">
            <input type="password" autoComplete="current-password" className="input" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Your password" required />
          </Field>
          <Field label="Type DELETE to confirm">
            <input className="input font-mono tracking-[0.3em]" value={confirmPhrase} onChange={(e) => setConfirmPhrase(e.target.value)} placeholder="DELETE" autoComplete="off" required />
          </Field>
          <button type="submit" disabled={deleteBusy || confirmPhrase.trim().toUpperCase() !== "DELETE" || !deletePassword} className="btn btn-danger !py-2.5 text-xs">
            {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete my account forever
          </button>
        </form>
      </section>
    </div>
  );
}
