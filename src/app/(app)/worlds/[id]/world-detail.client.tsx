"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Plus,
  Pin,
  Star,
  Pencil,
  Trash2,
  LayoutDashboard,
  Loader2,
  Blocks,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { useToast } from "@/components/providers/Toast";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { WorldFormModal, WorldIcon, coverCss, backgroundCss } from "@/components/worlds/WorldFormModal";
import { WidgetShell } from "@/components/worlds/WidgetShell";
import { WidgetLibrary } from "@/components/worlds/WidgetLibrary";
import { WidgetRenderer } from "@/components/worlds/widgets";
import { widgetDefinition } from "@/components/worlds/widget-registry";
import {
  getWorld,
  updateWorld,
  deleteWorldDeep,
  duplicateWorld,
  listWidgets,
  addWidget,
  updateWidget,
  deleteWidget,
  persistWidgetLayout,
  listMedia,
} from "@/lib/firebase/worlds";
import { touchRecentWorld } from "@/lib/recentWorlds";
import { cx } from "@/lib/utils";
import type { MediaItem, WidgetSize, WidgetType, World, WorldWidget } from "@/lib/types";

const sizeSpanClass = (size: WidgetSize) =>
  ({
    sm: "col-span-12 sm:col-span-6 lg:col-span-4",
    md: "col-span-12 sm:col-span-6 lg:col-span-6",
    lg: "col-span-12 lg:col-span-8",
    xl: "col-span-12",
  }[size]);

const MIN_ROWS: Partial<Record<WidgetType, string>> = {
  clock: "min-h-[160px]",
  weather: "min-h-[170px]",
  quotes: "min-h-[150px]",
  countdown: "min-h-[180px]",
  goals: "min-h-[210px]",
  calendar: "min-h-[300px]",
  files: "min-h-[180px]",
  bookmarks: "min-h-[180px]",
  quicklinks: "min-h-[170px]",
  music: "min-h-[240px]",
  photos: "min-h-[220px]",
  videos: "min-h-[220px]",
  notes: "min-h-[230px]",
  tasks: "min-h-[210px]",
  journal: "min-h-[240px]",
};

export default function WorldDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useApp();
  const { success, error } = useToast();
  const uid = user?.uid ?? "";

  const [world, setWorld] = useState<World | null>(null);
  const [widgets, setWidgets] = useState<WorldWidget[] | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const widgetsRef = useRef<WorldWidget[] | null>(null);
  widgetsRef.current = widgets;
  const pendingConfig = useRef(new Map<string, number>());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const load = useCallback(async () => {
    if (!uid || !id) return;
    try {
      const w = await getWorld(uid, id);
      if (!w) {
        setNotFound(true);
        return;
      }
      setWorld(w);
      touchRecentWorld(uid, w);
      const [list, m] = await Promise.all([listWidgets(uid, id), listMedia(uid)]);
      setWidgets(list);
      setMedia(m);
      setLoadError(null);
    } catch (e) {
      // Never leave the user staring at skeletons — offer a retry instead.
      setLoadError(e instanceof Error ? e.message : "Could not load this world.");
    }
  }, [uid, id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => () => {
    pendingConfig.current.forEach((t) => window.clearTimeout(t));
  }, []);

  /* ── widget ops ── */

  const handleConfig = useCallback(
    (widgetId: string, patch: Record<string, unknown>) => {
      setWidgets((prev) =>
        prev?.map((w) => (w.id === widgetId ? { ...w, config: { ...w.config, ...patch } } : w)) ?? prev
      );
      const map = pendingConfig.current;
      const existing = map.get(widgetId);
      if (existing) window.clearTimeout(existing);
      map.set(
        widgetId,
        window.setTimeout(() => {
          const latest = widgetsRef.current?.find((w) => w.id === widgetId);
          if (latest) {
            void updateWidget(uid, id, widgetId, { config: latest.config }).catch(() =>
              error("Save failed", "That change couldn't be saved. Check your connection.")
            );
          }
          map.delete(widgetId);
        }, 650)
      );
    },
    [uid, id, error]
  );

  const handleAddWidget = async (type: WidgetType) => {
    const def = widgetDefinition(type);
    const order = (widgetsRef.current?.length ?? 0);
    const created = await addWidget(uid, id, type, def.title, order);
    setWidgets((prev) => [...(prev ?? []), created]);
    success("Widget added", def.title);
  };

  const handleRemoveWidget = async (widgetId: string) => {
    setWidgets((prev) => (prev ?? []).filter((w) => w.id !== widgetId));
    await deleteWidget(uid, id, widgetId).catch(() => error("Remove failed", "Please try again."));
  };

  const setSize = useCallback(
    (widgetId: string, size: WidgetSize) => {
      setWidgets((prev) => {
        if (!prev) return prev;
        const next = prev.map((w) => (w.id === widgetId ? { ...w, size } : w));
        persistWidgetLayout(uid, id, next.map((w, i) => ({ id: w.id, order: i, size: w.size }))).catch(() =>
          error("Layout not saved", "Check your connection.")
        );
        return next;
      });
    },
    [uid, id, error]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWidgets((prev) => {
      if (!prev) return prev;
      const oldIndex = prev.findIndex((w) => w.id === active.id);
      const newIndex = prev.findIndex((w) => w.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      persistWidgetLayout(uid, id, next.map((w, i) => ({ id: w.id, order: i, size: w.size }))).catch(() =>
        error("Layout not saved", "Check your connection.")
      );
      return next;
    });
  };

  const togglePin = async () => {
    if (!world) return;
    const pinned = !world.pinned;
    setWorld({ ...world, pinned });
    await updateWorld(uid, world.id, { pinned }).catch(() => setWorld(world));
  };

  const toggleDefault = async () => {
    if (!world) return;
    const next = !world.isDefault;
    setWorld({ ...world, isDefault: next });
    await updateWorld(uid, world.id, { isDefault: next }).catch(() => setWorld(world));
    success(next ? "Default world set" : "Default cleared", world.name);
  };

  const confirmDelete = async () => {
    if (!world) return;
    setDeleting(true);
    try {
      await deleteWorldDeep(uid, world.id);
      success("World deleted", world.name);
      router.replace("/worlds");
    } catch {
      error("Delete failed", "Please try again.");
      setDeleting(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <Blocks className="h-10 w-10 text-[var(--app-muted)]" />
        <h1 className="mt-4 text-lg font-bold text-[var(--app-text)]">Couldn&apos;t open this world</h1>
        <p className="mt-1 max-w-sm text-sm text-[var(--app-muted)]">{loadError}</p>
        <button onClick={() => { setLoadError(null); setWidgets(null); void load(); }} className="btn btn-primary mt-6">
          Retry
        </button>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <Blocks className="h-10 w-10 text-[var(--app-muted)]" />
        <h1 className="mt-4 text-lg font-bold text-[var(--app-text)]">That world doesn&apos;t exist (anymore)</h1>
        <p className="mt-1 text-sm text-[var(--app-muted)]">It may have been deleted from another session.</p>
        <Link href="/worlds" className="btn btn-primary mt-6"><ArrowLeft className="h-4 w-4" /> Back to My Worlds</Link>
      </div>
    );
  }

  if (!world || widgets === null) {
    return (
      <div className="p-6">
        <div className="skeleton h-40 w-full rounded-3xl" />
        <div className="mt-4 grid grid-cols-12 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cx(sizeSpanClass(i % 3 === 0 ? "sm" : i % 3 === 1 ? "md" : "lg"), "skeleton h-48 rounded-2xl")} />
          ))}
        </div>
      </div>
    );
  }

  const bg = backgroundCss(world.background);

  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh">
      {/* Ambient world background */}
      {bg !== "transparent" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: bg, backgroundSize: world.background === "grid" ? "44px 44px" : undefined }}
        />
      )}

      <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Cover banner */}
        <div
          className="relative mt-4 overflow-hidden rounded-3xl border border-white/10"
          style={{ background: coverCss(world.cover) }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
          <div className="relative flex min-h-36 flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-end gap-4">
              <Link href="/worlds" aria-label="Back to worlds" className="mb-1 hidden rounded-xl bg-black/35 p-2 text-white/85 backdrop-blur transition-colors hover:bg-black/55 sm:block">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-2xl ring-2 ring-white/25" style={{ background: world.accent }}>
                <WorldIcon name={world.icon} className="h-7 w-7" />
              </span>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/60">My World</p>
                <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-3xl">{world.name}</h1>
                {world.description && <p className="mt-0.5 max-w-md text-[11px] text-white/75">{world.description}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={togglePin} aria-pressed={world.pinned} title={world.pinned ? "Unpin" : "Pin world"} className="rounded-xl bg-black/35 p-2.5 text-white/85 backdrop-blur transition-all hover:bg-black/55 hover:text-amber-300">
                <Pin className={cx("h-5 w-5", world.pinned && "fill-amber-400 text-amber-400")} />
              </button>
              <button onClick={toggleDefault} aria-pressed={world.isDefault} title={world.isDefault ? "Unset default" : "Set as default world"} className="rounded-xl bg-black/35 p-2.5 text-white/85 backdrop-blur transition-all hover:bg-black/55 hover:text-amber-300">
                <Star className={cx("h-5 w-5", world.isDefault && "fill-amber-400 text-amber-400")} />
              </button>
              <Dropdown
                trigger={
                  <span className="rounded-xl bg-black/35 p-2.5 text-white/85 backdrop-blur transition-colors hover:bg-black/55">
                    <LayoutDashboard className="h-5 w-5" />
                  </span>
                }
              >
                <DropdownItem icon={Pencil} label="Edit world" onClick={() => setEditOpen(true)} />
                <DropdownItem icon={Blocks} label="Duplicate world" onClick={async () => {
                  const newId = await duplicateWorld(uid, world.id, `${world.name} (copy)`);
                  success("World duplicated", "Widgets included.");
                  if (newId) router.push(`/worlds/${newId}`);
                }} />
                <DropdownItem icon={Trash2} label="Delete world" danger onClick={() => setDeleteOpen(true)} />
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Widget grid header */}
        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--app-muted)]">
            {widgets.length} widget{widgets.length === 1 ? "" : "s"} · drag the handles to arrange
          </h2>
          <button onClick={() => setLibraryOpen(true)} className="btn btn-primary !py-2 text-xs">
            <Plus className="h-4 w-4" /> Add widget
          </button>
        </div>

        {/* Widget grid */}
        {widgets.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-indigo-500/30 bg-indigo-500/[0.04] px-6 py-16 text-center">
            <Blocks className="h-9 w-9 text-indigo-400" />
            <p className="mt-4 font-bold text-[var(--app-text)]">A beautiful, empty world</p>
            <p className="mt-1 max-w-xs text-xs text-[var(--app-muted)]">
              Add notes, tasks, a calendar, your music — compose this space around your life.
            </p>
            <button onClick={() => setLibraryOpen(true)} className="btn btn-primary mt-6">
              <Plus className="h-4 w-4" /> Open the widget library
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
              <div className="mt-4 grid grid-cols-12 gap-3">
                {widgets.map((widget) => (
                  <SortableWidget
                    key={widget.id}
                    widget={widget}
                    uid={uid}
                    worldId={world.id}
                    accent={world.accent}
                    media={media}
                    onConfig={handleConfig}
                    setSize={setSize}
                    onRemove={handleRemoveWidget}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Library + edit + delete */}
      <WidgetLibrary
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        existing={widgets.map((w) => w.type)}
        onAdd={handleAddWidget}
      />
      <WorldFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit world"
        initial={world}
        submitLabel="Save changes"
        onSubmit={async (value) => {
          await updateWorld(uid, world.id, value);
          setWorld({ ...world, ...value });
          success("World updated", value.name);
        }}
      />
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this world?" maxWidth="max-w-sm">
        <p className="text-sm leading-relaxed text-[var(--app-muted)]">
          <span className="font-semibold text-[var(--app-text)]">{world.name}</span> and everything inside it will be
          permanently deleted. Files in My Media are kept, detached.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete forever
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ── Sortable wrapper ── */

function SortableWidget({
  widget,
  uid,
  worldId,
  accent,
  media,
  onConfig,
  setSize,
  onRemove,
}: {
  widget: WorldWidget;
  uid: string;
  worldId: string;
  accent: string;
  media: MediaItem[];
  onConfig: (widgetId: string, patch: Record<string, unknown>) => void;
  setSize: (widgetId: string, size: WidgetSize) => void;
  onRemove: (widgetId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(sizeSpanClass(widget.size), MIN_ROWS[widget.type] ?? "min-h-[190px]")}
    >
      <WidgetShell
        id={widget.id}
        title={widget.title}
        size={widget.size}
        accent={accent}
        dragAttributes={attributes}
        dragListeners={listeners}
        setSize={(size) => setSize(widget.id, size)}
        onRemove={() => onRemove(widget.id)}
        isDragging={isDragging}
      >
        <WidgetRenderer
          uid={uid}
          worldId={worldId}
          widget={widget}
          media={media}
          accent={accent}
          onConfig={(patch) => onConfig(widget.id, patch)}
        />
      </WidgetShell>
    </div>
  );
}
