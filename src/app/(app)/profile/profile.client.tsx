"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Loader2,
  Globe2,
  FolderOpen,
  CalendarDays,
  MapPin,
  Briefcase,
  Sparkles,
  Settings,
  ChevronRight,
  BadgeCheck,
  ListTodo,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { useToast } from "@/components/providers/Toast";
import { Avatar } from "@/components/ui/Avatar";
import { updateProfile } from "@/lib/firebase/profile";
import { listWorlds, listMedia, listOpenTasksAcrossWorlds } from "@/lib/firebase/worlds";
import type { MediaItem, World } from "@/lib/types";

export default function ProfilePage() {
  const { user, profile, applyProfile } = useApp();
  const { success, error } = useToast();
  const uid = user?.uid ?? "";

  const [worlds, setWorlds] = useState<World[] | null>(null);
  const [media, setMedia] = useState<MediaItem[] | null>(null);
  const [openTasks, setOpenTasks] = useState<number | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const [w, m] = await Promise.all([listWorlds(uid), listMedia(uid)]);
        setWorlds(w);
        setMedia(m);
        const tasks = await listOpenTasksAcrossWorlds(uid, w.map((x) => ({ id: x.id, name: x.name })));
        setOpenTasks(tasks.length);
      } catch {
        setWorlds([]);
        setMedia([]);
        setOpenTasks(0);
      }
    })();
  }, [uid]);

  const changeAvatar = useCallback(
    async (file: File) => {
      if (!uid || !profile) return;
      if (!file.type.startsWith("image/")) {
        error("Not an image", "Choose an image file for your avatar.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        error("Too large", "Avatars are limited to 8 MB (resized before saving).");
        return;
      }
      setAvatarBusy(true);
      try {
        // Downscale client-side — stays well under Firestore's 1 MB doc limit.
        const bitmap = await createImageBitmap(file);
        const max = 256;
        const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
        const w = Math.max(1, Math.round(bitmap.width * scale));
        const h = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unsupported");
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close();
        const url = canvas.toDataURL("image/jpeg", 0.85);
        await updateProfile(uid, { avatarUrl: url });
        applyProfile({ avatarUrl: url });
        success("Avatar updated", "Looking sharp.");
      } catch {
        error("Upload failed", "Try a different image.");
      } finally {
        setAvatarBusy(false);
      }
    },
    [uid, profile, applyProfile, success, error]
  );

  const removeAvatar = useCallback(async () => {
    if (!uid) return;
    setAvatarBusy(true);
    try {
      await updateProfile(uid, { avatarUrl: null });
      applyProfile({ avatarUrl: null });
      success("Avatar removed", "Back to your initials.");
    } catch {
      error("Could not remove avatar", "Try again in a moment.");
    } finally {
      setAvatarBusy(false);
    }
  }, [uid, applyProfile, success, error]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="skeleton h-40 w-full rounded-3xl" />
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const displayName = profile.preferredName || profile.fullName.split(" ")[0];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      {/* Hero card */}
      <section className="overflow-hidden rounded-3xl border border-[var(--app-line)] bg-[var(--app-panel)]">
        <div
          className="relative h-36 sm:h-44"
          style={{
            background:
              "radial-gradient(700px 300px at 15% 0%, rgba(99,102,241,.5), transparent 65%), radial-gradient(500px 280px at 85% 20%, rgba(236,72,153,.35), transparent 60%), linear-gradient(135deg,#12101f 0%,#1b1730 100%)",
          }}
          aria-hidden
        />
        <div className="relative px-5 pb-6 sm:px-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative -mt-12 sm:-mt-16">
                <Avatar name={profile.fullName} src={profile.avatarUrl} size={96} className="ring-4 ring-[var(--app-panel)] sm:!h-28 sm:!w-28" />
                <button
                  onClick={() => avatarInput.current?.click()}
                  disabled={avatarBusy}
                  aria-label="Change profile picture"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--app-line)] bg-[var(--app-panel-2)] text-[var(--app-text)] shadow transition-all hover:scale-110 hover:text-indigo-300 disabled:opacity-60"
                >
                  {avatarBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void changeAvatar(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[var(--app-text)] sm:text-3xl">{profile.fullName}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--app-muted)]">
                  <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-indigo-400" /> YOU since {memberSince}</span>
                  {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1">
              {profile.avatarUrl && (
                <button onClick={removeAvatar} disabled={avatarBusy} className="btn btn-ghost !px-3 !py-1.5 text-[11px]">
                  Remove photo
                </button>
              )}
              <Link href="/settings" className="btn btn-ghost !px-3 !py-1.5 text-[11px]">
                <Settings className="h-4 w-4" /> Edit in Settings <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 max-w-2xl rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel-2)] p-4 text-sm leading-relaxed text-[var(--app-text)]">
              {profile.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-[var(--app-muted)]">
            {profile.occupation && (
              <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-indigo-400" /> {profile.occupation}</span>
            )}
            {profile.ageRange && (
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-indigo-400" /> {profile.ageRange}</span>
            )}
            <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-indigo-400" /> Goes by “{displayName}”</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Worlds" value={worlds?.length} icon={Globe2} />
        <StatCard label="Media files" value={media?.length} icon={FolderOpen} />
        <StatCard label="Open tasks" value={openTasks} icon={ListTodo} />
        <StatCard label="Interests" value={profile.interests.length} icon={Sparkles} />
      </div>

      {/* Interests */}
      <section className="mt-5 rounded-3xl border border-[var(--app-line)] bg-[var(--app-panel)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--app-muted)]">Your constellation — interests</h2>
          <Link href="/settings" className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300">Edit</Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.interests.length === 0 ? (
            <p className="text-xs text-[var(--app-muted)]">No interests charted yet.</p>
          ) : (
            profile.interests.map((interest) => (
              <span key={interest} className="chip chip-active">{interest}</span>
            ))
          )}
        </div>
      </section>

      {/* Preferences snapshot */}
      <section className="mt-4 rounded-3xl border border-[var(--app-line)] bg-[var(--app-panel)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--app-muted)]">How YOU works for you</h2>
          <Link href="/settings" className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300">Edit</Link>
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-[11px] sm:grid-cols-2">
          <PreferenceRow k="Language" v={profile.preferences.language} />
          <PreferenceRow k="Theme" v={capitalize(profile.preferences.theme)} />
          <PreferenceRow k="Communication" v={profile.preferences.communicationStyle} />
          <PreferenceRow k="Response length" v={profile.preferences.responseLength} />
        </dl>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | null | undefined; icon: typeof Globe2 }) {
  return (
    <div className="rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] p-4">
      <Icon className="h-4 w-4 text-indigo-400" />
      <p className="mt-2 font-mono text-2xl font-bold text-[var(--app-text)]">
        {value === null || value === undefined ? <span className="skeleton inline-block h-6 w-10 rounded" /> : value}
      </p>
      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--app-muted)]">{label}</p>
    </div>
  );
}

function PreferenceRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--app-panel-2)] px-3 py-2.5">
      <dt className="text-[var(--app-muted)]">{k}</dt>
      <dd className="truncate font-semibold text-[var(--app-text)]">{v}</dd>
    </div>
  );
}

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
