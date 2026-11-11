"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pin,
  Star,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Loader2,
  Globe2,
  ChevronDown,
  Compass,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { useToast } from "@/components/providers/Toast";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { WorldFormModal, WorldIcon, coverCss } from "@/components/worlds/WorldFormModal";
import {
  listWorlds,
  createWorld,
  updateWorld,
  deleteWorldDeep,
  duplicateWorld,
} from "@/lib/firebase/worlds";
import { timeAgo, cx } from "@/lib/utils";
import type { World } from "@/lib/types";

type SortKey = "recent" | "name" | "created";

export default function WorldsPage() {
  const router = useRouter();
  const { user } = useApp();
  const { success, error } = useToast();
  const uid = user?.uid ?? "";

  const [worlds, setWorlds] = useState<World[] | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [createOpen, setCreateOpen] = useState(false);
  const [editWorld, setEditWorld] = useState<World | null>(null);
  const [deleteWorld, setDeleteWorld] = useState<World | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      setWorlds(await listWorlds(uid));
    } catch {
      error("Could not load worlds", "Check your connection and try again.");
      setWorlds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    let list = [...(worlds ?? [])];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (w) => w.name.toLowerCase().includes(q) || (w.description ?? "").toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "created":
        list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        break;
      default:
        break; // already sorted by pinned → updatedAt
    }
    return list;
  }, [worlds, query, sort]);

  const togglePin = async (w: World) => {
    await updateWorld(uid, w.id, { pinned: !w.pinned });
    setWorlds((prev) => (prev ?? []).map((x) => (x.id === w.id ? { ...x, pinned: !x.pinned } : x)));
  };

  const toggleDefault = async (w: World) => {
    const next = !w.isDefault;
    // Only one default world — clear others first.
    const current = worlds ?? [];
    await Promise.all(
      current.filter((x) => x.isDefault && x.id !== w.id).map((x) => updateWorld(uid, x.id, { isDefault: false }))
    );
    await updateWorld(uid, w.id, { isDefault: next });
    setWorlds((prev) => (prev ?? []).map((x) => ({ ...x, isDefault: x.id === w.id ? next : false })));
    success(next ? "Default world set" : "Default cleared", w.name);
  };

  const duplicate = async (w: World) => {
    setDuplicating(w.id);
    try {
      const id = await duplicateWorld(uid, w.id, `${w.name} (copy)`);
      success("World duplicated", "Its widgets came along too.");
      await load();
      if (id) router.push(`/worlds/${id}`);
    } catch {
      error("Duplication failed", "Please try again.");
    } finally {
      setDuplicating(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteWorld) return;
    setDeleting(true);
    try {
      await deleteWorldDeep(uid, deleteWorld.id);
      success("World deleted", deleteWorld.name);
      setDeleteWorld(null);
      await load();
    } catch {
      error("Delete failed", "Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-indigo-400">My Worlds</p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold tracking-[-0.03em] text-[var(--app-text)] sm:text-4xl">
            <Globe2 className="h-8 w-8 text-indigo-400" /> Your universe
          </h1>
          <p className="mt-1.5 text-sm text-[var(--app-muted)]">
            Independent spaces for each part of you — private, customizable, yours.
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Create world
        </button>
      </div>

      {/* Search + sort bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your worlds…"
            aria-label="Search worlds"
            className="input !pl-10"
          />
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort worlds"
            className="input appearance-none !pr-9 sm:w-44"
          >
            <option value="recent">Sort: Recent</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="created">Sort: Newest</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
        </div>
      </div>

      {/* Grid */}
      {worlds === null ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-3xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-[var(--app-line)] py-16 text-center">
          <Compass className="h-9 w-9 text-indigo-400" />
          <p className="mt-4 font-bold text-[var(--app-text)]">
            {query ? "No worlds match that search" : "No worlds yet"}
          </p>
          <p className="mt-1 max-w-xs text-sm text-[var(--app-muted)]">
            {query ? "Try a different name or clear the search." : "Create the first space in your universe."}
          </p>
          {!query && (
            <button onClick={() => setCreateOpen(true)} className="btn btn-primary mt-6">
              <Plus className="h-4 w-4" /> Create world
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((w) => (
            <article
              key={w.id}
              className="group overflow-hidden rounded-3xl border border-[var(--app-line)] bg-[var(--app-panel)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-[0_24px_50px_-20px_rgba(99,102,241,.35)]"
            >
              {/* Cover */}
              <Link href={`/worlds/${w.id}`} className="relative block h-28" style={{ background: coverCss(w.cover) }} aria-label={`Open ${w.name}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-end gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg ring-2 ring-black/20" style={{ background: w.accent }}>
                    <WorldIcon name={w.icon} className="h-5 w-5" />
                  </span>
                  <div className="pb-0.5">
                    <h2 className="max-w-[160px] truncate text-base font-extrabold leading-tight text-white">{w.name}</h2>
                    {w.isDefault && (
                      <p className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-300">
                        <Star className="h-2.5 w-2.5 fill-amber-300" /> Default
                      </p>
                    )}
                  </div>
                </div>
                {w.pinned && <Pin className="absolute right-3 top-3 h-4 w-4 fill-amber-400 text-amber-400" />}
              </Link>

              {/* Body */}
              <div className="flex items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-[var(--app-muted)]">{w.description || "A private corner of your universe"}</p>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]/70">
                    Updated {timeAgo(w.updatedAt)}
                  </p>
                </div>
                <Dropdown
                  trigger={
                    <span className="rounded-xl border border-[var(--app-line)] p-2 text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]">
                      <MoreVertical className="h-4 w-4" />
                    </span>
                  }
                >
                  <DropdownItem icon={Pencil} label="Edit world" onClick={() => setEditWorld(w)} />
                  <DropdownItem icon={w.pinned ? Pin : Pin} label={w.pinned ? "Unpin world" : "Pin world"} onClick={() => togglePin(w)} />
                  <DropdownItem icon={Star} label={w.isDefault ? "Unset default" : "Set as default"} onClick={() => toggleDefault(w)} />
                  <DropdownItem icon={Copy} label={duplicating === w.id ? "Duplicating…" : "Duplicate world"} onClick={() => duplicate(w)} />
                  <DropdownItem icon={Trash2} label="Delete world" danger onClick={() => setDeleteWorld(w)} />
                </Dropdown>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create / Edit modals */}
      <WorldFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a new world"
        submitLabel="Create world"
        onSubmit={async (value) => {
          const id = await createWorld(uid, value);
          await load();
          router.push(`/worlds/${id}`);
        }}
      />
      <WorldFormModal
        open={editWorld !== null}
        onClose={() => setEditWorld(null)}
        title="Edit world"
        initial={editWorld ?? undefined}
        submitLabel="Save changes"
        onSubmit={async (value) => {
          if (!editWorld) return;
          await updateWorld(uid, editWorld.id, value);
          success("World updated", value.name);
          await load();
        }}
      />

      {/* Delete confirm */}
      <Modal open={deleteWorld !== null} onClose={() => setDeleteWorld(null)} title="Delete this world?" maxWidth="max-w-sm">
        <p className="text-sm leading-relaxed text-[var(--app-muted)]">
          <span className="font-semibold text-[var(--app-text)]">{deleteWorld?.name}</span> and its
          widgets, notes, tasks and journal entries will be permanently deleted. Media stays in My Media, detached.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setDeleteWorld(null)} disabled={deleting}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete forever
          </button>
        </div>
      </Modal>
    </div>
  );
}
