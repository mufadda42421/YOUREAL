"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  Search,
  LayoutGrid,
  List,
  Folder,
  FolderPlus,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  File as FileIcon,
  ChevronDown,
  ArrowUpDown,
  Trash2,
  Download,
  FolderInput,
  Globe2,
  X,
  Check,
  MoreVertical,
  Pencil,
  Loader2,
  Play,
  CheckSquare,
  Square,
  HardDrive,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { useToast } from "@/components/providers/Toast";
import { Modal } from "@/components/ui/Modal";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import {
  listMedia,
  listFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  updateMediaItem,
  deleteMediaItem,
  mediaKindFor,
  validateUpload,
  uploadMediaFile,
  fetchMediaDataUrl,
  listWorlds,
} from "@/lib/firebase/worlds";
import { formatBytes, timeAgo, cx } from "@/lib/utils";
import type { MediaItem, MediaFolder, MediaKind, World } from "@/lib/types";

type SortKey = "name" | "createdAt" | "size" | "kind";
const SORT_LABEL: Record<SortKey, string> = { name: "Name", createdAt: "Date added", size: "Size", kind: "Type" };

const KIND_ICON: Record<MediaKind, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  pdf: FileText,
  document: FileText,
  other: FileIcon,
};
const KIND_TINT: Record<MediaKind, string> = {
  image: "text-fuchsia-400 bg-fuchsia-500/10",
  video: "text-orange-400 bg-orange-500/10",
  audio: "text-rose-400 bg-rose-500/10",
  pdf: "text-rose-400 bg-rose-500/10",
  document: "text-sky-400 bg-sky-500/10",
  other: "text-slate-400 bg-slate-500/10",
};

interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

const ALL = "all";
const UNSORTED = "unsorted";

export default function MediaPage() {
  const { user } = useApp();
  const { success, error } = useToast();
  const uid = user?.uid ?? "";

  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<MediaKind | "all">("all");
  const [worldFilter, setWorldFilter] = useState<string | "all" | "unattached">("all");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<MediaItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveTarget, setMoveTarget] = useState<string | null>(null); // null | folderId | 'root'
  const [worldTarget, setWorldTarget] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<MediaItem[] | null>(null);
  const [busy, setBusy] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const [m, f, w] = await Promise.all([listMedia(uid), listFolders(uid), listWorlds(uid).catch(() => [])]);
      setItems(m);
      setFolders(f);
      setWorlds(w);
    } catch {
      error("Could not load media", "Check your connection.");
      setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => { void load(); }, [load]);

  // Fetch the full blob only when a preview is opened (grid shows inline thumbnails).
  useEffect(() => {
    let cancelled = false;
    setPreviewUrl(null);
    if (!preview) return;
    setPreviewLoading(true);
    fetchMediaDataUrl(uid, preview.id)
      .then((url) => { if (!cancelled) setPreviewUrl(url); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview?.id]);

  const downloadItem = useCallback(
    async (item: MediaItem) => {
      const url = await fetchMediaDataUrl(uid, item.id);
      if (!url) {
        error("Could not fetch file", "Try again in a moment.");
        return;
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      a.click();
    },
    [uid, error]
  );

  /* ── uploads (Firestore, free tier) ── */
  const startUploads = useCallback(
    (files: File[]) => {
      if (!uid || files.length === 0) return;
      const folderId = currentFolder.startsWith("folder:") ? currentFolder.slice(7) : null;
      for (const file of files) {
        const kind = mediaKindFor(file.type, file.name);
        const problem = validateUpload(kind, file.size);
        const taskId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        if (problem) {
          setUploads((u) => [...u, { id: taskId, name: file.name, progress: 0, status: "error", error: problem }]);
          continue;
        }

        setUploads((u) => [...u, { id: taskId, name: file.name, progress: 0, status: "uploading" }]);

        uploadMediaFile(uid, file, folderId, (pct) => {
          setUploads((u) => u.map((t) => (t.id === taskId ? { ...t, progress: pct } : t)));
        })
          .then(async () => {
            setUploads((u) => u.map((t) => (t.id === taskId ? { ...t, status: "done", progress: 100 } : t)));
            await load();
          })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : "Upload failed. Please try again.";
            setUploads((u) => u.map((t) => (t.id === taskId ? { ...t, status: "error", error: message } : t)));
          });
      }
    },
    [uid, currentFolder, load]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      startUploads(Array.from(e.dataTransfer.files ?? []));
    },
    [startUploads]
  );

  /* ── derived list ── */
  const visible = useMemo(() => {
    let list = [...(items ?? [])];
    if (currentFolder === UNSORTED) list = list.filter((m) => !m.folderId);
    else if (currentFolder.startsWith("folder:")) {
      const fid = currentFolder.slice(7);
      list = list.filter((m) => m.folderId === fid);
    }
    if (kindFilter !== "all") list = list.filter((m) => m.kind === kindFilter);
    if (worldFilter === "unattached") list = list.filter((m) => !m.worldId);
    else if (worldFilter !== "all") list = list.filter((m) => m.worldId === worldFilter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q));
    list.sort((a, b) => {
      const cmp =
        sort === "name" ? a.name.localeCompare(b.name)
        : sort === "size" ? a.size - b.size
        : sort === "kind" ? a.kind.localeCompare(b.kind)
        : (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      return cmp * sortDir;
    });
    return list;
  }, [items, currentFolder, kindFilter, worldFilter, query, sort, sortDir]);

  const allVisibleSelected = visible.length > 0 && visible.every((m) => selected.has(m.id));
  const toggleSelectAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((m) => next.delete(m.id));
      else visible.forEach((m) => next.add(m.id));
      return next;
    });
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectedItems = useMemo(() => (items ?? []).filter((m) => selected.has(m.id)), [items, selected]);
  const totalBytes = useMemo(() => (items ?? []).reduce((sum, m) => sum + (m.size || 0), 0), [items]);

  /* ── actions ── */
  const confirmDelete = async () => {
    if (!deleteTargets) return;
    setBusy(true);
    for (const item of deleteTargets) {
      await deleteMediaItem(uid, item).catch(() => {});
    }
    success(deleteTargets.length === 1 ? "File deleted" : `${deleteTargets.length} files deleted`);
    setDeleteTargets(null);
    setSelected(new Set());
    setBusy(false);
    await load();
  };

  const applyMove = async (folderId: string | null) => {
    const ids = selectedItems.map((m) => m.id);
    for (const id of ids) await updateMediaItem(uid, id, { folderId }).catch(() => {});
    success(folderId ? "Moved to folder" : "Moved to All files", `${ids.length} item${ids.length === 1 ? "" : "s"}`);
    setMoveTarget(null);
    setSelected(new Set());
    await load();
  };

  const attachToWorld = async (worldId: string | null) => {
    const ids = selectedItems.map((m) => m.id);
    for (const id of ids) await updateMediaItem(uid, id, { worldId }).catch(() => {});
    success(worldId ? "Attached to world" : "Detached", worlds.find((w) => w.id === worldId)?.name ?? "My Media");
    setWorldTarget(false);
    setSelected(new Set());
    await load();
  };

  const downloadSelected = async () => {
    for (const item of selectedItems) {
      await downloadItem(item);
    }
  };

  const commitRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    await updateMediaItem(uid, renameTarget.id, { name: renameValue.trim() });
    success("Renamed", renameValue.trim());
    setRenameTarget(null);
    await load();
  };

  const createNewFolder = async () => {
    const name = folderName.trim();
    if (name.length < 1) return;
    await createFolder(uid, name);
    setFolderName("");
    setNewFolderOpen(false);
    success("Folder created", name);
    await load();
  };

  const removeFolder = async (folder: MediaFolder) => {
    await deleteFolder(uid, folder.id);
    if (currentFolder === `folder:${folder.id}`) setCurrentFolder(ALL);
    success("Folder deleted", "Its files were moved back to All files.");
    await load();
  };

  const folderCount = (id: string) => (items ?? []).filter((m) => m.folderId === id).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-indigo-400">My Media</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-[var(--app-text)] sm:text-4xl">Your private archive</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--app-muted)]">
            <span className="flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5" /> {items?.length ?? 0} files · {formatBytes(totalBytes)}</span>
            <span>·</span>
            <span>Stored only for your account</span>
          </p>
        </div>
        <button onClick={() => fileInput.current?.click()} className="btn btn-primary">
          <UploadCloud className="h-4 w-4" /> Upload files
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.rtf,.odt,.ods,.odp"
          onChange={(e) => {
            startUploads(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files by dropping them here"
        onClick={() => fileInput.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cx(
          "mt-5 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-7 text-center transition-all",
          dragOver ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]" : "border-[var(--app-line)] hover:border-indigo-500/40 hover:bg-indigo-500/[0.03]"
        )}
      >
        <UploadCloud className={cx("h-8 w-8 transition-colors", dragOver ? "text-indigo-400" : "text-[var(--app-muted)]")} />
        <p className="mt-2 text-sm font-semibold text-[var(--app-text)]">Drop anything — photos, videos, audio, PDFs</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--app-muted)]">Photos, audio, PDFs &amp; docs up to 700 KB · stored free in Firestore</p>
      </div>

      {/* Upload progress */}
      {uploads.some((u) => u.status === "uploading" || u.status === "error") && (
        <div className="mt-3 space-y-1.5">
          {uploads.filter((u) => u.status !== "done").map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-[var(--app-line)] bg-[var(--app-panel)] px-3 py-2">
              <FileIcon className="h-4 w-4 shrink-0 text-[var(--app-muted)]" />
              <span className="min-w-0 flex-1 truncate text-xs text-[var(--app-text)]">{u.name}</span>
              {u.status === "error" ? (
                <span className="max-w-56 text-right text-[10px] font-medium text-rose-400">{u.error}</span>
              ) : (
                <span className="flex w-40 items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--app-panel-2)]">
                    <span className="block h-full rounded-full bg-indigo-500 transition-all duration-200" style={{ width: `${u.progress}%` }} />
                  </span>
                  <span className="font-mono text-[9px] tabular-nums text-[var(--app-muted)]">{u.progress}%</span>
                </span>
              )}
              <button onClick={() => setUploads((prev) => prev.filter((x) => x.id !== u.id))} className="text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-5 lg:flex-row">
        {/* Folder sidebar */}
        <aside className="w-full shrink-0 lg:w-52">
          <p className="px-1 text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--app-muted)]">Library</p>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            <FolderButton active={currentFolder === ALL} icon={FolderOpen} label="All files" count={items?.length ?? 0} onClick={() => setCurrentFolder(ALL)} />
            <FolderButton active={currentFolder === UNSORTED} icon={Folder} label="Unsorted" count={(items ?? []).filter((m) => !m.folderId).length} onClick={() => setCurrentFolder(UNSORTED)} />
            {folders.map((f) => (
              <div key={f.id} className="group/row relative shrink-0">
                <FolderButton
                  active={currentFolder === `folder:${f.id}`}
                  icon={currentFolder === `folder:${f.id}` ? FolderOpen : Folder}
                  label={f.name}
                  count={folderCount(f.id)}
                  onClick={() => setCurrentFolder(`folder:${f.id}`)}
                />
                <button
                  onClick={() => removeFolder(f)}
                  aria-label={`Delete folder ${f.name}`}
                  className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded p-1 text-[var(--app-muted)] hover:text-rose-400 lg:group-hover/row:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setNewFolderOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-[var(--app-line)] px-3 py-2 text-[11px] font-semibold text-[var(--app-muted)] transition-colors hover:border-indigo-500/40 hover:text-indigo-300"
            >
              <FolderPlus className="h-4 w-4" /> New folder
            </button>
          </div>

          {/* World attachment legend */}
          <div className="mt-4 hidden rounded-2xl border border-[var(--app-line)] bg-[var(--app-panel)] p-3 lg:block">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--app-muted)]">Tip</p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--app-muted)]">
              Select files and use <span className="text-[var(--app-text)]">Attach</span> to assign them to a world —
              photos and files appear in that world&apos;s gallery widgets.
            </p>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-36 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files…" aria-label="Search files" className="input !pl-9 !py-2 text-xs" />
            </div>
            <select value={worldFilter} onChange={(e) => setWorldFilter(e.target.value)} aria-label="Filter by world" className="input !w-auto !py-2 text-xs">
              <option value="all">All worlds</option>
              <option value="unattached">Unattached</option>
              {worlds.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as MediaKind | "all")} aria-label="Filter by type" className="input !w-auto !py-2 text-xs">
              <option value="all">All types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="pdf">PDFs</option>
              <option value="document">Documents</option>
              <option value="other">Other</option>
            </select>
            <div className="flex items-center rounded-xl border border-[var(--app-line)]">
              <button onClick={() => { setSort((s) => (Object.keys(SORT_LABEL) as SortKey[])[(Object.keys(SORT_LABEL).indexOf(s) + 1) % 4]); }} title="Cycle sort field" aria-label="Cycle sort field" className="flex items-center gap-1.5 rounded-l-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] hover:text-[var(--app-text)]">
                <ArrowUpDown className="h-3.5 w-3.5" /> {SORT_LABEL[sort]}
              </button>
              <button onClick={() => setSortDir((d) => (d === 1 ? -1 : 1))} className="rounded-r-xl border-l border-[var(--app-line)] px-2 py-2 text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label="Toggle sort direction">
                <ChevronDown className={cx("h-4 w-4 transition-transform", sortDir === 1 && "rotate-180")} />
              </button>
            </div>
            <div className="flex rounded-xl border border-[var(--app-line)] p-0.5">
              <button onClick={() => setView("grid")} aria-pressed={view === "grid"} aria-label="Grid view" className={cx("rounded-lg p-2", view === "grid" ? "bg-indigo-500/20 text-indigo-300" : "text-[var(--app-muted)]")}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setView("list")} aria-pressed={view === "list"} aria-label="List view" className={cx("rounded-lg p-2", view === "list" ? "bg-indigo-500/20 text-indigo-300" : "text-[var(--app-muted)]")}>
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Selection bar */}
          {visible.length > 0 && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--app-muted)] hover:text-[var(--app-text)]">
                {allVisibleSelected ? <CheckSquare className="h-4 w-4 text-indigo-400" /> : <Square className="h-4 w-4" />}
                {allVisibleSelected ? "Clear all" : "Select all"}
              </button>
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="mr-1 font-mono text-[10px] text-indigo-300">{selectedItems.length} selected</span>
                  <button onClick={downloadSelected} className="rounded-lg border border-[var(--app-line)] p-2 text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label="Download selected" title="Download"><Download className="h-4 w-4" /></button>
                  <button onClick={() => setMoveTarget("root-pick")} className="rounded-lg border border-[var(--app-line)] p-2 text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label="Move to folder" title="Move to folder"><FolderInput className="h-4 w-4" /></button>
                  <button onClick={() => setWorldTarget(true)} className="rounded-lg border border-[var(--app-line)] p-2 text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label="Attach to world" title="Attach to world"><Globe2 className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTargets(selectedItems)} className="rounded-lg border border-rose-500/30 p-2 text-rose-400 hover:bg-rose-500/10" aria-label="Delete selected" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          )}

          {/* Grid / list */}
          {items === null ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-[var(--app-line)] py-14 text-center">
              <Folder className="h-8 w-8 text-[var(--app-muted)]" />
              <p className="mt-3 text-sm font-bold text-[var(--app-text)]">{query ? "Nothing matches that search" : "This shelf is empty"}</p>
              <p className="mt-1 max-w-xs text-xs text-[var(--app-muted)]">Drop files above or hit Upload — they stay here forever, visible only to you.</p>
            </div>
          ) : view === "grid" ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  onToggle={() => toggleSelect(item.id)}
                  onOpen={() => setPreview(item)}
                  onRename={() => { setRenameTarget(item); setRenameValue(item.name); }}
                  onDelete={() => setDeleteTargets([item])}
                  onDownload={() => void downloadItem(item)}
                  worlds={worlds}
                />
              ))}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--app-line)] overflow-hidden rounded-2xl border border-[var(--app-line)]">
              {visible.map((item) => {
                const Icon = KIND_ICON[item.kind];
                const worldName = worlds.find((w) => w.id === item.worldId)?.name;
                return (
                  <li key={item.id} className="flex items-center gap-3 bg-[var(--app-panel)] px-3 py-2 transition-colors hover:bg-[var(--app-panel-2)]">
                    <button onClick={() => toggleSelect(item.id)} aria-label={`Select ${item.name}`} className="text-[var(--app-muted)] hover:text-indigo-400">
                      {selected.has(item.id) ? <CheckSquare className="h-5 w-5 text-indigo-400" /> : <Square className="h-5 w-5" />}
                    </button>
                    <button onClick={() => setPreview(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", KIND_TINT[item.kind])}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-[var(--app-text)]">{item.name}</span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--app-muted)]">
                          {formatBytes(item.size)} · {timeAgo(item.createdAt)}{worldName ? ` · ${worldName}` : ""}
                        </span>
                      </span>
                    </button>
                    <Dropdown trigger={<span className="rounded-lg p-2 text-[var(--app-muted)] hover:text-[var(--app-text)]"><MoreVertical className="h-4 w-4" /></span>}>
                      <DropdownItem icon={Pencil} label="Rename" onClick={() => { setRenameTarget(item); setRenameValue(item.name); }} />
                      <DropdownItem icon={Download} label="Download" onClick={() => void downloadItem(item)} />
                      <DropdownItem icon={Trash2} label="Delete" danger onClick={() => setDeleteTargets([item])} />
                    </Dropdown>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Preview modal ── */}
      <Modal open={preview !== null} onClose={() => setPreview(null)} title={preview?.name} maxWidth="max-w-3xl">
        {preview && (
          <div>
            {previewLoading && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-xl bg-[var(--app-panel-2)]">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                <p className="text-xs text-[var(--app-muted)]">Loading preview…</p>
              </div>
            )}
            {!previewLoading && previewUrl && (
              <>
                {preview.kind === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={preview.name} className="max-h-[65vh] w-full rounded-xl object-contain" />
                )}
                {preview.kind === "video" && <video src={previewUrl} controls autoPlay className="max-h-[65vh] w-full rounded-xl" />}
                {preview.kind === "audio" && (
                  <div className="flex flex-col items-center rounded-2xl border border-[var(--app-line)] p-8">
                    <Music className="h-12 w-12 text-rose-400" />
                    <audio src={previewUrl} controls autoPlay className="mt-4 w-full" />
                  </div>
                )}
                {preview.kind === "pdf" && <iframe src={previewUrl} title={preview.name} className="h-[65vh] w-full rounded-xl border border-[var(--app-line)]" />}
                {(preview.kind === "document" || preview.kind === "other") && (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--app-line)] p-10 text-center">
                    <FileText className="h-12 w-12 text-sky-400" />
                    <p className="mt-3 text-sm font-semibold text-[var(--app-text)]">{preview.name}</p>
                    <p className="mt-1 font-mono text-[10px] text-[var(--app-muted)]">{preview.mimeType || "unknown type"} · {formatBytes(preview.size)}</p>
                    <button onClick={() => void downloadItem(preview)} className="btn btn-primary mt-5"><Download className="h-4 w-4" /> Download file</button>
                  </div>
                )}
              </>
            )}
            {!previewLoading && !previewUrl && (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-xl bg-[var(--app-panel-2)] text-center">
                <FileText className="h-8 w-8 text-[var(--app-muted)]" />
                <p className="text-xs text-[var(--app-muted)]">Couldn&apos;t load this file. It may have been removed.</p>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--app-muted)]">{formatBytes(preview.size)} · {timeAgo(preview.createdAt)}</p>
              <button onClick={() => void downloadItem(preview)} className="btn btn-ghost !px-3 !py-1.5 text-xs"><Download className="h-4 w-4" /> Download</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── New folder ── */}
      <Modal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} title="New folder" maxWidth="max-w-sm">
        <label htmlFor="folder-name" className="label">Folder name</label>
        <input id="folder-name" autoFocus value={folderName} onChange={(e) => setFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createNewFolder()} placeholder="Inspiration, 2026, Recipes…" className="input" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setNewFolderOpen(false)} className="btn btn-ghost">Cancel</button>
          <button onClick={createNewFolder} disabled={!folderName.trim()} className="btn btn-primary">Create folder</button>
        </div>
      </Modal>

      {/* ── Rename ── */}
      <Modal open={renameTarget !== null} onClose={() => setRenameTarget(null)} title="Rename file" maxWidth="max-w-sm">
        <label htmlFor="rename" className="label">New name</label>
        <input id="rename" autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commitRename()} className="input" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setRenameTarget(null)} className="btn btn-ghost">Cancel</button>
          <button onClick={commitRename} disabled={!renameValue.trim()} className="btn btn-primary"><Check className="h-4 w-4" /> Rename</button>
        </div>
      </Modal>

      {/* ── Move to folder ── */}
      <Modal open={moveTarget !== null} onClose={() => setMoveTarget(null)} title="Move to folder" maxWidth="max-w-sm">
        <div className="max-h-72 space-y-1 overflow-y-auto">
          <button onClick={() => applyMove(null)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--app-text)] hover:bg-[var(--app-panel-2)]">
            <FolderOpen className="h-4 w-4 text-indigo-400" /> All files (no folder)
          </button>
          {folders.map((f) => (
            <button key={f.id} onClick={() => applyMove(f.id)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--app-text)] hover:bg-[var(--app-panel-2)]">
              <Folder className="h-4 w-4 text-indigo-400" /> {f.name}
              <span className="ml-auto font-mono text-[10px] text-[var(--app-muted)]">{folderCount(f.id)}</span>
            </button>
          ))}
          {folders.length === 0 && <p className="px-3 py-4 text-center text-xs text-[var(--app-muted)]">No folders yet — create one first.</p>}
        </div>
      </Modal>

      {/* ── Attach to world ── */}
      <Modal open={worldTarget} onClose={() => setWorldTarget(false)} title="Attach to a world" maxWidth="max-w-sm">
        <p className="text-xs text-[var(--app-muted)]">Attached media appears in that world&apos;s photo, video and file widgets.</p>
        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          <button onClick={() => attachToWorld(null)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--app-text)] hover:bg-[var(--app-panel-2)]">
            <X className="h-4 w-4 text-[var(--app-muted)]" /> Detach (keep in My Media)
          </button>
          {worlds.map((w) => (
            <button key={w.id} onClick={() => attachToWorld(w.id)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--app-text)] hover:bg-[var(--app-panel-2)]">
              <Globe2 className="h-4 w-4" style={{ color: w.accent }} /> {w.name}
            </button>
          ))}
          {worlds.length === 0 && <p className="px-3 py-4 text-center text-xs text-[var(--app-muted)]">No worlds yet — create one first.</p>}
        </div>
      </Modal>

      {/* ── Delete confirm ── */}
      <Modal open={deleteTargets !== null} onClose={() => setDeleteTargets(null)} title={deleteTargets?.length === 1 ? "Delete this file?" : `Delete ${deleteTargets?.length} files?`} maxWidth="max-w-sm">
        <p className="text-sm text-[var(--app-muted)]">This permanently removes the file{deleteTargets?.length === 1 ? "" : "s"} from storage. There is no undo.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setDeleteTargets(null)} disabled={busy}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete forever
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ── Small pieces ── */

function FolderButton({ active, icon: Icon, label, count, onClick }: { active: boolean; icon: typeof Folder; label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "flex w-40 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all lg:w-full",
        active ? "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/40" : "text-[var(--app-muted)] hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      <span className="font-mono text-[9px] opacity-70">{count}</span>
    </button>
  );
}

function MediaCard({
  item,
  selected,
  onToggle,
  onOpen,
  onRename,
  onDelete,
  onDownload,
  worlds,
}: {
  item: MediaItem;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  worlds: World[];
}) {
  const Icon = KIND_ICON[item.kind];
  const worldName = worlds.find((w) => w.id === item.worldId)?.name;

  return (
    <div className={cx(
      "group relative overflow-hidden rounded-2xl border bg-[var(--app-panel)] transition-all",
      selected ? "border-indigo-500/60 ring-2 ring-indigo-500/40" : "border-[var(--app-line)] hover:border-indigo-500/30"
    )}>
      <button onClick={onToggle} aria-pressed={selected} aria-label={`Select ${item.name}`} className="absolute left-2 top-2 z-10 rounded-md bg-black/55 p-1.5 text-white/85 backdrop-blur transition-opacity hover:text-white md:opacity-0 md:group-hover:opacity-100">
        {selected ? <CheckSquare className="h-4 w-4 text-indigo-300" /> : <Square className="h-4 w-4" />}
      </button>
      <Dropdown
        className="absolute right-2 top-2 z-10"
        trigger={<span className="block rounded-md bg-black/55 p-1.5 text-white/85 opacity-0 backdrop-blur transition-opacity hover:text-white group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></span>}
      >
        <DropdownItem icon={Pencil} label="Rename" onClick={onRename} />
        <DropdownItem icon={Download} label="Download" onClick={onDownload} />
        <DropdownItem icon={Trash2} label="Delete" danger onClick={onDelete} />
      </Dropdown>

      <button onClick={onOpen} className="block w-full text-left" aria-label={`Preview ${item.name}`}>
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[var(--app-panel-2)]">
          {item.kind === "image" && item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnail} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : item.kind === "video" ? (
            <span className="relative flex h-full w-full items-center justify-center bg-black">
              <Video className="h-10 w-10 text-white/60" />
              <Play className="absolute h-8 w-8 text-white" />
            </span>
          ) : (
            <span className={cx("flex h-16 w-16 items-center justify-center rounded-2xl", KIND_TINT[item.kind])}>
              <Icon className="h-8 w-8" />
            </span>
          )}
        </div>
        <div className="p-2.5">
          <p className="truncate text-[11px] font-semibold text-[var(--app-text)]" title={item.name}>{item.name}</p>
          <p className="mt-0.5 truncate font-mono text-[8px] uppercase tracking-wider text-[var(--app-muted)]">
            {formatBytes(item.size)}{worldName ? ` · ${worldName}` : ""}
          </p>
        </div>
      </button>
    </div>
  );
}
