"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  Briefcase,
  User,
  AtSign,
  Sparkles,
  ShieldCheck,
  Plus,
  X,
  Sun,
  Moon,
  Monitor,
  Quote,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { useToast } from "@/components/providers/Toast";
import { PinUnlockScreen } from "@/components/app/PinUnlockScreen";
import { LogoMark } from "@/components/ui/Logo";
import { updateProfile } from "@/lib/firebase/profile";
import {
  INTEREST_SUGGESTIONS,
  AGE_RANGES,
  LANGUAGES,
  COMMUNICATION_STYLES,
  RESPONSE_LENGTHS,
} from "@/lib/constants";
import { cx } from "@/lib/utils";
import { validatePin } from "@/lib/validation";
import type { ThemePreference } from "@/lib/types";

const STEPS = [
  { id: "about", title: "About you", hint: "The basics — share what you want" },
  { id: "interests", title: "Your interests", hint: "Pick everything that pulls at you" },
  { id: "preferences", title: "Your preferences", hint: "How YOU should feel and speak" },
  { id: "protect", title: "Protection", hint: "Optional PIN for shared devices" },
] as const;

const SIDE_QUOTES = [
  "You are not building a streak for an algorithm. You are building trust with your future self.",
  "The internet is about everyone. YOU is about you.",
  "Knowing yourself is the beginning of all wisdom.",
];

export default function OnboardingPage() {
  const { status, profile, applyProfile, enablePin, refreshProfile } = useApp();
  const { success, error } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — basic
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [location, setLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");

  // Step 2 — interests
  const [interests, setInterests] = useState<string[]>([]);
  const [interestDraft, setInterestDraft] = useState("");

  // Step 3 — preferences
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState<ThemePreference>("dark");
  const [communicationStyle, setCommunicationStyle] = useState<string>(COMMUNICATION_STYLES[0]);
  const [responseLength, setResponseLength] = useState("Balanced");
  const [topics, setTopics] = useState<string[]>([]);
  const [topicDraft, setTopicDraft] = useState("");
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [dislikeDraft, setDislikeDraft] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
  const [goals, setGoals] = useState<string[]>([]);

  // Step 4 — optional PIN
  const [wantPin, setWantPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const [touched, setTouched] = useState(false);

  // Seed from existing profile (e.g. partial onboarding then return)
  useEffect(() => {
    if (profile) {
      setFullName((v) => v || profile.fullName || "");
      setPreferredName((v) => v || profile.preferredName || "");
      setAgeRange((v) => v || profile.ageRange || "");
      setLocation((v) => v || profile.location || "");
      setOccupation((v) => v || profile.occupation || "");
      setBio((v) => v || profile.bio || "");
      setInterests((v) => (v.length ? v : profile.interests ?? []));
      setLanguage((v) => (v !== "English" ? v : profile.preferences?.language ?? "English"));
      setTheme((v) => (v !== "dark" ? v : profile.preferences?.theme ?? "dark"));
      setCommunicationStyle((v) =>
        v !== COMMUNICATION_STYLES[0] ? v : (profile.preferences?.communicationStyle as typeof v) || COMMUNICATION_STYLES[0]
      );
      setResponseLength((v) => (v !== "Balanced" ? v : profile.preferences?.responseLength ?? "Balanced"));
      setTopics((v) => (v.length ? v : profile.preferences?.topics ?? []));
      setDislikes((v) => (v.length ? v : profile.preferences?.dislikes ?? []));
      setGoals((v) => (v.length ? v : profile.preferences?.goals ?? []));
    }
  }, [profile]);

  // Route guards
  useEffect(() => {
    if (status === "signed-out") router.replace("/?auth=signup");
    if (status === "ready" && profile?.onboardingCompleted) router.replace("/dashboard");
  }, [status, profile?.onboardingCompleted, router]);

  const sideQuote = SIDE_QUOTES[step % SIDE_QUOTES.length];
  const basicsValid = fullName.trim().length >= 2;
  const pinReady = !wantPin || (validatePin(pin) === null && pin === pinConfirm);

  const toggleInterest = (label: string) =>
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );

  const addChip = (
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    clearDraft: (v: string) => void
  ) => {
    const cleaned = value.trim();
    if (cleaned && !list.includes(cleaned) && list.length < 24) {
      setList([...list, cleaned]);
    }
    clearDraft("");
  };

  const finish = async () => {
    if (!profile) return;
    setTouched(true);
    if (!basicsValid) {
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      // Optional PIN first — fail before completing onboarding
      if (wantPin) {
        const pinErr = validatePin(pin);
        if (pinErr) {
          setPinError(pinErr);
          setStep(3);
          setSaving(false);
          return;
        }
        if (pin !== pinConfirm) {
          setPinError("PINs do not match.");
          setStep(3);
          setSaving(false);
          return;
        }
        const pinResult = await enablePin(pin);
        if (!pinResult.ok) {
          error("PIN not saved", pinResult.error);
          setStep(3);
          setSaving(false);
          return;
        }
      }

      const patch = {
        fullName: fullName.trim(),
        preferredName: (preferredName.trim() || fullName.trim().split(" ")[0]).trim(),
        ageRange,
        location: location.trim(),
        occupation: occupation.trim(),
        bio: bio.trim(),
        interests,
        preferences: {
          theme,
          language,
          communicationStyle,
          responseLength,
          topics,
          dislikes,
          goals,
        },
        onboardingCompleted: true,
      };
      await updateProfile(profile.uid, patch);
      applyProfile(patch);
      await refreshProfile();
      success("Your world is ready", "Welcome home, " + (patch.preferredName || "friend") + ".");
      router.replace("/dashboard");
    } catch {
      error("Could not save", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  if (status === "loading" || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#08080a]">
        <LogoMark size={44} className="animate-pulse" />
      </div>
    );
  }
  if (status === "locked") return <PinUnlockScreen />;
  if (status === "signed-out" || profile.onboardingCompleted) return null;

  return (
    <div className="flex min-h-dvh bg-[#08080a] text-neutral-100">
      {/* ── Branded side panel (desktop) ── */}
      <aside className="relative hidden w-[42%] max-w-xl shrink-0 flex-col justify-between overflow-hidden border-r border-white/5 p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(800px 500px at 20% 0%, rgba(99,102,241,.30), transparent 60%), radial-gradient(700px 600px at 90% 100%, rgba(236,72,153,.18), transparent 55%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <LogoMark size={34} />
          <span className="text-xl font-extrabold tracking-tight text-white">YOU<span className="text-indigo-400">.</span></span>
        </div>

        <div className="relative">
          <Quote className="h-8 w-8 text-indigo-500/60" />
          <blockquote className="mt-5 text-balance text-2xl font-semibold leading-snug tracking-[-0.02em] text-neutral-100">
            “{sideQuote}”
          </blockquote>
          <div className="mt-10 flex items-center gap-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={cx(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300",
                    i < step ? "bg-indigo-500 text-white" : i === step ? "ring-2 ring-indigo-400 text-indigo-300" : "border border-white/10 text-neutral-600"
                  )}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className="h-px w-6 bg-white/10" />}
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-600">
            Step {step + 1} of {STEPS.length} — {STEPS[step].title}
          </p>
        </div>

        <p className="relative text-[11px] text-neutral-600">
          Everything here is optional except your name — skip freely, edit later in Settings.
        </p>
      </aside>

      {/* ── Form side ── */}
      <main className="flex min-h-dvh flex-1 flex-col">
        {/* Mobile progress */}
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3 lg:hidden">
          <LogoMark size={26} />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full bg-indigo-500"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            />
          </div>
          <span className="font-mono text-[10px] text-neutral-500">{step + 1}/{STEPS.length}</span>
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-8 sm:px-8 lg:py-12">
          <AnimatePresence mode="wait">
            <motion.section
              key={step}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              <p className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-indigo-400 lg:block">
                {String(step + 1).padStart(2, "0")} · {STEPS[step].hint}
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-white sm:text-4xl">
                {STEPS[step].title}
              </h1>

              {/* ─────────── STEP 1 · BASICS ─────────── */}
              {step === 0 && (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="onb-full" className="label">Full name *</label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                        <input id="onb-full" className={cx("input pl-10", touched && !basicsValid && "input-error")} placeholder="Aria Bennett" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                      </div>
                      {touched && !basicsValid && <p className="mt-1.5 text-[11px] text-rose-400">Please enter your name.</p>}
                    </div>
                    <div>
                      <label htmlFor="onb-pref" className="label">What should YOU call you?</label>
                      <div className="relative">
                        <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                        <input id="onb-pref" className="input pl-10" placeholder={fullName.split(" ")[0] || "Aria"} value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="onb-age" className="label">Age range <span className="opacity-50">(optional)</span></label>
                      <select id="onb-age" className="input" value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                        <option value="">Prefer not to say</option>
                        {AGE_RANGES.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="onb-loc" className="label">Location <span className="opacity-50">(optional)</span></label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                        <input id="onb-loc" className="input pl-10" placeholder="Lisbon, Portugal" value={location} onChange={(e) => setLocation(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="onb-occ" className="label">What do you do? <span className="opacity-50">(optional)</span></label>
                    <div className="relative">
                      <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      <input id="onb-occ" className="input pl-10" placeholder="Student, designer, founder, night-shift nurse…" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="onb-bio" className="label">A short introduction to yourself <span className="opacity-50">(optional)</span></label>
                    <textarea id="onb-bio" rows={3} maxLength={280} className="input resize-none" placeholder="A night owl who paints, prototypes and overthinks breakfast…" value={bio} onChange={(e) => setBio(e.target.value)} />
                    <p className="mt-1 text-right font-mono text-[10px] text-neutral-600">{bio.length}/280</p>
                  </div>
                </div>
              )}

              {/* ─────────── STEP 2 · INTERESTS ─────────── */}
              {step === 1 && (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_SUGGESTIONS.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleInterest(label)}
                        aria-pressed={interests.includes(label)}
                        className={cx("chip", interests.includes(label) && "chip-active")}
                      >
                        {interests.includes(label) && <Check className="h-3 w-3" />}
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 flex gap-2">
                    <input
                      className="input"
                      placeholder="Something else… (press Enter)"
                      value={interestDraft}
                      onChange={(e) => setInterestDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addChip(interestDraft, interests, setInterests, setInterestDraft);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addChip(interestDraft, interests, setInterests, setInterestDraft)}
                      className="btn btn-subtle !px-3"
                      aria-label="Add interest"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {interests.length > 0 && (
                    <div className="mt-5">
                      <p className="label">Your constellation · {interests.length} selected</p>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((i) => (
                          <span key={i} className="chip chip-active">
                            {i}
                            <button onClick={() => toggleInterest(i)} aria-label={`Remove ${i}`} className="rounded-full p-0.5 hover:bg-white/10">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─────────── STEP 3 · PREFERENCES ─────────── */}
              {step === 2 && (
                <div className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="onb-lang" className="label">Preferred language</label>
                      <select id="onb-lang" className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                        {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <fieldset>
                      <legend className="label">Theme</legend>
                      <div className="grid grid-cols-3 gap-1.5">
                        {([
                          { id: "light", label: "Light", icon: Sun },
                          { id: "dark", label: "Dark", icon: Moon },
                          { id: "system", label: "System", icon: Monitor },
                        ] as const).map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setTheme(id)}
                            aria-pressed={theme === id}
                            className={cx(
                              "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[11px] font-semibold transition-all",
                              theme === id
                                ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                                : "border-white/8 bg-white/[0.03] text-neutral-400 hover:border-white/15"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  <div>
                    <span className="label">Communication style</span>
                    <div className="flex flex-wrap gap-2">
                      {COMMUNICATION_STYLES.map((s) => (
                        <button key={s} type="button" onClick={() => setCommunicationStyle(s)} aria-pressed={communicationStyle === s} className={cx("chip", communicationStyle === s && "chip-active")}>{s}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="label">Response length</span>
                    <div className="flex gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1">
                      {RESPONSE_LENGTHS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setResponseLength(r)}
                          aria-pressed={responseLength === r}
                          className={cx(
                            "flex-1 rounded-lg py-2 text-[11px] font-semibold transition-all",
                            responseLength === r ? "bg-indigo-600 text-white shadow" : "text-neutral-400 hover:text-neutral-200"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ChipEditor label="Topics you love" placeholder="e.g. generative art, space…" list={topics} setList={setTopics} draft={topicDraft} setDraft={setTopicDraft} />
                  <ChipEditor label="Things you dislike" placeholder="e.g. clickbait, cold calls…" list={dislikes} setList={setDislikes} draft={dislikeDraft} setDraft={setDislikeDraft} />
                  <ChipEditor label="Personal goals" placeholder="e.g. run a 10k, write a novel…" list={goals} setList={setGoals} draft={goalDraft} setDraft={setGoalDraft} />
                </div>
              )}

              {/* ─────────── STEP 4 · PROTECTION ─────────── */}
              {step === 3 && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setWantPin((v) => !v)}
                    aria-pressed={wantPin}
                    className={cx(
                      "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all",
                      wantPin ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/8 bg-white/[0.02] hover:border-white/15"
                    )}
                  >
                    <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", wantPin ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-neutral-500")}>
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-white">Enable 4-digit PIN</span>
                      <span className="mt-0.5 block text-xs text-neutral-500">Great for shared devices — asked when switching into this account.</span>
                    </span>
                    <span className={cx("flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors", wantPin ? "justify-end bg-indigo-600" : "justify-start bg-white/10")}>
                      <motion.span layout className="h-5 w-5 rounded-full bg-white shadow" />
                    </span>
                  </button>

                  {wantPin && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 overflow-hidden">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="onb-pin" className="label">Create PIN</label>
                            <input
                              id="onb-pin"
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength={4}
                              type="password"
                              placeholder="••••"
                              value={pin}
                              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(null); }}
                              className="input text-center font-mono text-2xl tracking-[0.6em]"
                            />
                          </div>
                          <div>
                            <label htmlFor="onb-pin2" className="label">Confirm PIN</label>
                            <input
                              id="onb-pin2"
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength={4}
                              type="password"
                              placeholder="••••"
                              value={pinConfirm}
                              onChange={(e) => { setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(null); }}
                              className="input text-center font-mono text-2xl tracking-[0.6em]"
                            />
                          </div>
                        </div>
                        {pinError && <p className="mt-2 text-[11px] text-rose-400">{pinError}</p>}
                        <p className="mt-3 text-[10px] leading-relaxed text-neutral-600">
                          Stored as a PBKDF2 hash — never your plain PIN, never in a form anyone can read back.
                          Forgot it later? Your account password recovers access.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between gap-3">
                {step > 0 ? (
                  <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-ghost !border-white/10 text-neutral-300">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                ) : <span />}
                {step < STEPS.length - 1 ? (
                  <div className="flex items-center gap-2">
                    {step > 0 && (
                      <button type="button" onClick={() => setStep((s) => s + 1)} className="text-xs font-semibold text-neutral-500 transition-colors hover:text-neutral-200">
                        Skip for now
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setTouched(true);
                        if (step === 0 && !basicsValid) return;
                        setTouched(false);
                        setStep((s) => s + 1);
                      }}
                      className="btn btn-primary"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={finish} disabled={saving || !pinReady} className="btn btn-primary !px-6">
                    {saving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Building your world…</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Enter YOU</>
                    )}
                  </button>
                )}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function ChipEditor({
  label,
  placeholder,
  list,
  setList,
  draft,
  setDraft,
}: {
  label: string;
  placeholder: string;
  list: string[];
  setList: (v: string[]) => void;
  draft: string;
  setDraft: (v: string) => void;
}) {
  const commit = () => {
    const cleaned = draft.trim();
    if (cleaned && !list.includes(cleaned) && list.length < 24) setList([...list, cleaned]);
    setDraft("");
  };
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={`${placeholder} (Enter to add)`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <button type="button" onClick={commit} className="btn btn-subtle !px-3" aria-label={`Add to ${label}`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {list.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {list.map((item) => (
            <span key={item} className="chip chip-active">
              {item}
              <button onClick={() => setList(list.filter((x) => x !== item))} aria-label={`Remove ${item}`} className="rounded-full p-0.5 hover:bg-white/10">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
