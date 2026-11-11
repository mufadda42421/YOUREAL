import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getAccountDb } from "./config";
import type {
  World,
  WorldWidget,
  NoteItem,
  TaskItem,
  JournalEntry,
  MediaItem,
  MediaFolder,
  MediaKind,
} from "@/lib/types";

const now = () => new Date().toISOString();
const wcol = (uid: string) => collection(getAccountDb(uid), "users", uid, "worlds");
const widgetsCol = (uid: string, worldId: string) =>
  collection(getAccountDb(uid), "users", uid, "worlds", worldId, "widgets");
const notesCol = (uid: string, worldId: string) =>
  collection(getAccountDb(uid), "users", uid, "worlds", worldId, "notes");
const tasksCol = (uid: string, worldId: string) =>
  collection(getAccountDb(uid), "users", uid, "worlds", worldId, "tasks");
const journalCol = (uid: string, worldId: string) =>
  collection(getAccountDb(uid), "users", uid, "worlds", worldId, "journal");
const mediaCol = (uid: string) => collection(getAccountDb(uid), "users", uid, "media");
const foldersCol = (uid: string) => collection(getAccountDb(uid), "users", uid, "folders");

/* ─── Worlds ─────────────────────────────────────────────────────────────── */

export async function listWorlds(uid: string): Promise<World[]> {
  const snap = await getDocs(wcol(uid));
  const worlds = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as World);
  return worlds.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
  });
}

export async function getWorld(uid: string, worldId: string): Promise<World | null> {
  const snap = await getDoc(doc(getAccountDb(uid), "users", uid, "worlds", worldId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as World) : null;
}

export async function createWorld(
  uid: string,
  data: Pick<World, "name" | "description" | "icon" | "cover" | "background" | "accent">
): Promise<string> {
  const id = doc(wcol(uid)).id;
  const ts = now();
  const world: World = {
    id,
    ...data,
    pinned: false,
    isDefault: false,
    createdAt: ts,
    updatedAt: ts,
    lastOpenedAt: ts,
  };
  await setDoc(doc(getAccountDb(uid), "users", uid, "worlds", id), world);
  return id;
}

export async function updateWorld(uid: string, worldId: string, patch: Partial<World>): Promise<void> {
  await updateDoc(doc(getAccountDb(uid), "users", uid, "worlds", worldId), {
    ...patch,
    updatedAt: now(),
  });
}

export async function deleteWorldDeep(uid: string, worldId: string): Promise<void> {
  const db = getAccountDb(uid);
  for (const sub of ["widgets", "notes", "tasks", "journal"]) {
    const snap = await getDocs(collection(db, "users", uid, "worlds", worldId, sub));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit().catch(() => {});
  }
  // Detach media (keep files, remove world association)
  const media = await getDocs(mediaCol(uid));
  const batch = writeBatch(db);
  media.docs.forEach((d) => {
    if (d.data().worldId === worldId) batch.update(d.ref, { worldId: null });
  });
  await batch.commit().catch(() => {});
  await deleteDoc(doc(db, "users", uid, "worlds", worldId));
}

export async function duplicateWorld(uid: string, worldId: string, newName: string): Promise<string | null> {
  const world = await getWorld(uid, worldId);
  if (!world) return null;
  const id = await createWorld(uid, {
    name: newName,
    description: world.description,
    icon: world.icon,
    cover: world.cover,
    background: world.background,
    accent: world.accent,
  });
  // Copy widgets
  const widgets = await listWidgets(uid, worldId);
  const db = getAccountDb(uid);
  const batch = writeBatch(db);
  for (const w of widgets) {
    const ref = doc(widgetsCol(uid, id));
    batch.set(ref, {
      type: w.type,
      title: w.title,
      size: w.size,
      order: w.order,
      config: w.config ?? {},
      createdAt: now(),
      updatedAt: now(),
    });
  }
  await batch.commit();
  return id;
}

/* ─── Widgets ────────────────────────────────────────────────────────────── */

export async function listWidgets(uid: string, worldId: string): Promise<WorldWidget[]> {
  const snap = await getDocs(widgetsCol(uid, worldId));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as WorldWidget)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addWidget(
  uid: string,
  worldId: string,
  type: WorldWidget["type"],
  title: string,
  order: number
): Promise<WorldWidget> {
  const id = doc(widgetsCol(uid, worldId)).id;
  const ts = now();
  const widget: WorldWidget = {
    id,
    type,
    title,
    size: "md",
    order,
    config: {},
    createdAt: ts,
    updatedAt: ts,
  };
  await setDoc(doc(getAccountDb(uid), "users", uid, "worlds", worldId, "widgets", id), widget);
  return widget;
}

export async function updateWidget(
  uid: string,
  worldId: string,
  widgetId: string,
  patch: Partial<Omit<WorldWidget, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(
    doc(getAccountDb(uid), "users", uid, "worlds", worldId, "widgets", widgetId),
    { ...patch, updatedAt: now() }
  );
}

export async function deleteWidget(uid: string, worldId: string, widgetId: string): Promise<void> {
  await deleteDoc(doc(getAccountDb(uid), "users", uid, "worlds", worldId, "widgets", widgetId));
}

/** Persist order + size for every widget in the world (batch). */
export async function persistWidgetLayout(
  uid: string,
  worldId: string,
  layout: Array<{ id: string; order: number; size: WorldWidget["size"] }>
): Promise<void> {
  const db = getAccountDb(uid);
  const batch = writeBatch(db);
  for (const item of layout) {
    batch.update(doc(db, "users", uid, "worlds", worldId, "widgets", item.id), {
      order: item.order,
      size: item.size,
      updatedAt: now(),
    });
  }
  await batch.commit();
}

/* ─── Notes ──────────────────────────────────────────────────────────────── */

export async function listNotes(uid: string, worldId: string): Promise<NoteItem[]> {
  const snap = await getDocs(notesCol(uid, worldId));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as NoteItem)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
    });
}

export async function upsertNote(uid: string, worldId: string, note: Omit<NoteItem, "id"> & { id?: string }): Promise<string> {
  const db = getAccountDb(uid);
  const id = note.id ?? doc(notesCol(uid, worldId)).id;
  await setDoc(doc(db, "users", uid, "worlds", worldId, "notes", id), {
    title: note.title,
    body: note.body,
    pinned: note.pinned,
    createdAt: note.createdAt,
    updatedAt: now(),
  });
  return id;
}

export async function deleteNote(uid: string, worldId: string, noteId: string): Promise<void> {
  await deleteDoc(doc(getAccountDb(uid), "users", uid, "worlds", worldId, "notes", noteId));
}

/* ─── Tasks ──────────────────────────────────────────────────────────────── */

export async function listTasks(uid: string, worldId: string): Promise<TaskItem[]> {
  const snap = await getDocs(tasksCol(uid, worldId));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as TaskItem)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function addTask(uid: string, worldId: string, text: string): Promise<TaskItem> {
  const id = doc(tasksCol(uid, worldId)).id;
  const task: TaskItem = { id, text, done: false, createdAt: now() };
  await setDoc(doc(getAccountDb(uid), "users", uid, "worlds", worldId, "tasks", id), task);
  return task;
}

export async function updateTask(
  uid: string,
  worldId: string,
  taskId: string,
  patch: Partial<TaskItem>
): Promise<void> {
  await updateDoc(doc(getAccountDb(uid), "users", uid, "worlds", worldId, "tasks", taskId), patch);
}

export async function deleteTask(uid: string, worldId: string, taskId: string): Promise<void> {
  await deleteDoc(doc(getAccountDb(uid), "users", uid, "worlds", worldId, "tasks", taskId));
}

/** Open tasks across every world — powers the home overview. */
export async function listOpenTasksAcrossWorlds(
  uid: string,
  worlds: Array<Pick<World, "id" | "name">>
): Promise<Array<TaskItem & { worldId: string; worldName: string }>> {
  const results: Array<TaskItem & { worldId: string; worldName: string }> = [];
  for (const w of worlds) {
    const snap = await getDocs(tasksCol(uid, w.id)).catch(() => null);
    if (!snap) continue;
    for (const d of snap.docs) {
      const t = d.data() as TaskItem;
      if (!t.done) {
        results.push({ id: d.id, text: t.text, done: t.done, createdAt: t.createdAt, worldId: w.id, worldName: w.name });
      }
    }
  }
  return results.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/* ─── Journal ────────────────────────────────────────────────────────────── */

export async function listJournal(uid: string, worldId: string): Promise<JournalEntry[]> {
  const snap = await getDocs(journalCol(uid, worldId));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as JournalEntry)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function addJournalEntry(
  uid: string,
  worldId: string,
  entry: Omit<JournalEntry, "id" | "createdAt">
): Promise<void> {
  const id = doc(journalCol(uid, worldId)).id;
  await setDoc(doc(getAccountDb(uid), "users", uid, "worlds", worldId, "journal", id), {
    ...entry,
    createdAt: now(),
  });
}

export async function deleteJournalEntry(uid: string, worldId: string, entryId: string): Promise<void> {
  await deleteDoc(doc(getAccountDb(uid), "users", uid, "worlds", worldId, "journal", entryId));
}

/* ─── Media ──────────────────────────────────────────────────────────────── */

export function mediaKindFor(mimeType: string, name: string): MediaKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (
    mimeType.startsWith("text/") ||
    /word|officedocument|excel|powerpoint|presentation/.test(mimeType) ||
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "csv", "json", "rtf", "odt", "ods", "odp"].includes(ext)
  )
    return "document";
  return "other";
}

/** Firestore documents cap at ~1 MB — keep media small enough for the free tier. */
export const MAX_MEDIA_BYTES = 700 * 1024;

export function validateUpload(kind: MediaKind, size: number): string | null {
  if (size === 0) return "File is empty.";
  if (size > MAX_MEDIA_BYTES) {
    return "Too big for free storage — keep files under 700 KB (photos, audio clips, PDFs, docs). Large videos need paid Storage.";
  }
  return null;
}

/** Downscale an image File to a small JPEG data URL (thumbnail, ~10–30 KB). Client-side only. */
export async function makeThumbnail(file: File, maxSize = 320, quality = 0.62): Promise<string | null> {
  if (!file.type.startsWith("image/") || typeof document === "undefined") return null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  }
}

const readAsDataURL = (file: File, onProgress?: (pct: number) => void) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.onprogress = (e) => {
      if (onProgress && e.lengthComputable && e.total > 0) {
        onProgress(Math.round((e.loaded / e.total) * 90));
      }
    };
    reader.readAsDataURL(file);
  });

/** Store a file as base64 in Firestore: metadata (with thumbnail) + blob subcollection. */
export async function uploadMediaFile(
  uid: string,
  file: File,
  folderId: string | null,
  onProgress?: (pct: number) => void
): Promise<MediaItem> {
  const kind = mediaKindFor(file.type, file.name);
  const problem = validateUpload(kind, file.size);
  if (problem) throw new Error(problem);

  const db = getAccountDb(uid);
  const mediaId = doc(collection(db, "users", uid, "media")).id;
  const thumbnail = kind === "image" ? await makeThumbnail(file) : null;
  const dataUrl = await readAsDataURL(file, onProgress);
  onProgress?.(97);

  const ts = new Date().toISOString();
  const item: MediaItem = {
    id: mediaId,
    name: file.name,
    kind,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    storagePath: `firestore:users/${uid}/media/${mediaId}`,
    url: dataUrl, // kept for type compatibility; large grids use `thumbnail`
    worldId: null,
    folderId,
    createdAt: ts,
    thumbnail,
  };

  const metaRef = doc(db, "users", uid, "media", mediaId);
  const blobRef = doc(db, "users", uid, "media", mediaId, "blob", "main");
  const { url: _omit, ...meta } = item as MediaItem & { url: string };
  const batch = writeBatch(db);
  batch.set(metaRef, meta);
  batch.set(blobRef, { dataUrl, createdAt: ts });
  await batch.commit();
  onProgress?.(100);
  return item;
}

/** Fetch the full base64 data URL for a media item (blob subcollection). Cached in-module. */
const dataUrlCache = new Map<string, string>();

export async function fetchMediaDataUrl(uid: string, mediaId: string): Promise<string | null> {
  const key = `${uid}:${mediaId}`;
  const hit = dataUrlCache.get(key);
  if (hit) return hit;
  try {
    const snap = await getDoc(doc(getAccountDb(uid), "users", uid, "media", mediaId, "blob", "main"));
    const url = (snap.data()?.dataUrl as string | undefined) ?? null;
    if (url) dataUrlCache.set(key, url);
    return url;
  } catch {
    return null;
  }
}

/** Small JPEG thumbnail stored with the metadata doc (grids never fetch full blobs). */
export function mediaThumbnail(item: MediaItem): string | null {
  return item.thumbnail ?? null;
}

export async function listMedia(uid: string): Promise<MediaItem[]> {
  const snap = await getDocs(mediaCol(uid));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as MediaItem)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function listFolders(uid: string): Promise<MediaFolder[]> {
  const snap = await getDocs(foldersCol(uid));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as MediaFolder)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createFolder(uid: string, name: string, worldId: string | null = null): Promise<string> {
  const id = doc(foldersCol(uid)).id;
  await setDoc(doc(getAccountDb(uid), "users", uid, "folders", id), {
    name: name.trim(),
    worldId,
    createdAt: now(),
  });
  return id;
}

export async function renameFolder(uid: string, folderId: string, name: string): Promise<void> {
  await updateDoc(doc(getAccountDb(uid), "users", uid, "folders", folderId), { name: name.trim() });
}

export async function deleteFolder(uid: string, folderId: string): Promise<void> {
  const db = getAccountDb(uid);
  // Move contained media back to root
  const media = await getDocs(mediaCol(uid));
  const batch = writeBatch(db);
  media.docs.forEach((d) => {
    if (d.data().folderId === folderId) batch.update(d.ref, { folderId: null });
  });
  await batch.commit().catch(() => {});
  await deleteDoc(doc(db, "users", uid, "folders", folderId));
}

export async function updateMediaItem(
  uid: string,
  mediaId: string,
  patch: Partial<Omit<MediaItem, "id" | "storagePath" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(getAccountDb(uid), "users", uid, "media", mediaId), patch);
}

/** Deletes the metadata doc and its blob subcollection. */
export async function deleteMediaItem(uid: string, item: MediaItem): Promise<void> {
  const db = getAccountDb(uid);
  await deleteDoc(doc(db, "users", uid, "media", item.id, "blob", "main")).catch(() => {});
  await deleteDoc(doc(db, "users", uid, "media", item.id)).catch(() => {});
  dataUrlCache.delete(`${uid}:${item.id}`);
}

export { serverTimestamp, query, orderBy };
