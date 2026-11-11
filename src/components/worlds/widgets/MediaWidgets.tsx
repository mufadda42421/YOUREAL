"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchMediaDataUrl } from "@/lib/firebase/worlds";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Image as ImageIcon,
  Video,
  FileText,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Link2,
} from "lucide-react";
import { cx, formatBytes, timeAgo } from "@/lib/utils";
import { inputSm, type WidgetProps } from "./common";
import type { MediaItem } from "@/lib/types";

const scopeBtn = (active: boolean) =>
  cx(
    "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] transition-all",
    active ? "bg-indigo-500/20 text-indigo-300" : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
  );

function useScopedMedia(media: MediaItem[], worldId: string, scope: string) {
  return useMemo(
    () => (scope === "world" ? media.filter((m) => m.worldId === worldId) : media),
    [media, worldId, scope]
  );
}

/* â”€â”€â”€ Music (uploaded audio + URLs) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface ExternalTrack {
  id: string;
  name: string;
  url: string;
}

export function MusicWidget({ widget, onConfig, media, uid }: WidgetProps) {
  // urls identity changes with every render â€” computing tracks inline keeps deps honest.
  const urls: ExternalTrack[] = (widget.config?.trackUrls as ExternalTrack[]) ?? [];
  const tracks = [
    ...media.filter((m) => m.kind === "audio").map((m) => ({ id: m.id, name: m.name, url: undefined as string | undefined, external: false })),
    ...urls.map((t) => ({ ...t, url: t.url as string | undefined, external: true })),
  ];

  // Derived selection â€” defaults to the first track without an effect.
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [resolved, setResolved] = useState<Record<string, string | null>>({});
  const requestedRef = useRef(new Set<string>());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentId = pickedId ?? tracks[0]?.id ?? null;
  const setCurrentId = setPickedId;
  const current = tracks.find((t) => t.id === currentId) ?? null;
  // External tracks carry their URL inline; uploads resolve the blob on demand.
  const currentSrc = current ? (current.external ? current.url : resolved[current.id] ?? undefined) : undefined;

  // Fetch the base64 blob for uploaded tracks when they become current.
  useEffect(() => {
    if (!current || current.external) return;
    if (currentSrc !== undefined) return;
    if (requestedRef.current.has(current.id)) return;
    requestedRef.current.add(current.id);
    fetchMediaDataUrl(uid, current.id).then((dataUrl) => {
      setResolved((prev) => ({ ...prev, [current.id]: dataUrl }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  const step = (dir: 1 | -1) => {
    if (tracks.length === 0) return;
    const idx = Math.max(0, tracks.findIndex((t) => t.id === currentId));
    const next = tracks[(idx + dir + tracks.length) % tracks.length];
    setCurrentId(next.id);
  };

  const addUrl = () => {
    let href = url.trim();
    if (!href) return;
    if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
    onConfig({ trackUrls: [...urls, { id: `url_${Date.now()}`, name: name.trim() || "Untitled track", url: href }] });
    setName("");
    setUrl("");
    setAddOpen(false);
  };

  const removeExternal = (id: string) =>
    onConfig({ trackUrls: urls.filter((t) => t.id !== id) });

  return (
    <div className="flex h-full flex-col">
      {current && currentSrc ? (
        <audio
          key={currentSrc}
          ref={audioRef}
          src={currentSrc}
          autoPlay
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => step(1)}
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          muted={muted}
        />
      ) : current ? (
        <p className="py-2 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--app-muted)]">
          {resolved[current.id] === null ? "Could not load this track" : "Loading track…"}
        </p>
      ) : null}

      {/* Track list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tracks.length === 0 && !addOpen && (
          <p className="flex flex-col items-center gap-1.5 py-4 text-center text-[11px] text-[var(--app-muted)]">
            <Music className="h-6 w-6 text-rose-400/70" />
            Upload audio to My Media, or pin a stream here.
          </p>
        )}
        {tracks.map((track) => (
          <div key={track.id} className={cx("group flex items-center gap-2 rounded-lg px-1.5 py-1.5", currentId === track.id && "bg-indigo-500/10")}>
            <button onClick={() => setCurrentId(track.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", currentId === track.id ? "bg-indigo-500/25 text-indigo-300" : "bg-[var(--app-panel-2)] text-[var(--app-muted)]")}>
                {currentId === track.id && playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold text-[var(--app-text)]">{track.name}</span>
                <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">{"external" in track && track.external ? "stream" : "uploaded"}</span>
              </span>
            </button>
            {"external" in track && track.external && (
              <button onClick={() => removeExternal(track.id)} className="hidden text-[var(--app-muted)] hover:text-rose-400 group-hover:block" aria-label="Remove track">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Player bar */}
      {current && (
        <div className="mt-1.5 border-t border-[var(--app-line)] pt-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={progress}
            onChange={(e) => {
              const t = Number(e.target.value);
              if (audioRef.current) audioRef.current.currentTime = t;
              setProgress(t);
            }}
            aria-label="Seek"
            className="h-1 w-full cursor-pointer accent-indigo-500"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="w-10 font-mono text-[9px] tabular-nums text-[var(--app-muted)]">{fmtTime(progress)}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => step(-1)} className="text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label="Previous track"><SkipBack className="h-4 w-4" /></button>
              <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white transition-transform hover:scale-105" aria-label={playing ? "Pause" : "Play"}>
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
              </button>
              <button onClick={() => step(1)} className="text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label="Next track"><SkipForward className="h-4 w-4" /></button>
            </div>
            <button onClick={() => setMuted((v) => !v)} className="flex w-10 justify-end text-[var(--app-muted)] hover:text-[var(--app-text)]" aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {addOpen ? (
        <div className="mt-2 space-y-1.5 border-t border-[var(--app-line)] pt-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Track nameâ€¦" className={inputSm} autoFocus />
          <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addUrl()} placeholder="Audio URL (https://â€¦)" className={inputSm} />
          <div className="flex gap-1.5">
            <button onClick={addUrl} className="btn btn-primary flex-1 !py-1.5 text-[11px]">Pin track</button>
            <button onClick={() => setAddOpen(false)} className="btn btn-ghost flex-1 !py-1.5 text-[11px]">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddOpen(true)} className="mt-1.5 flex items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--app-line)] py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)] hover:border-indigo-500/40 hover:text-indigo-300">
          <Link2 className="h-3 w-3" /> Pin audio URL
        </button>
      )}
    </div>
  );
}
const fmtTime = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/* â”€â”€â”€ Photo gallery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/** On-demand fetch of the base64 blob for an item (widgets never hold it up front). */
function useMediaDataUrl(uid: string, id: string | null) {
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setUrl(undefined);
    setFailed(false);
    if (!id) return;
    let cancelled = false;
    fetchMediaDataUrl(uid, id).then((u) => {
      if (cancelled) return;
      if (u) setUrl(u);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, id]);
  return { url, failed };
}

export function PhotosWidget({ widget, onConfig, media, worldId, uid }: WidgetProps) {
  const scope = (widget.config?.scope as string) ?? "all";
  const [lightbox, setLightbox] = useState<number | null>(null);
  const scoped = useScopedMedia(media, worldId, scope).filter((m) => m.kind === "image");
  const current = lightbox !== null ? scoped[lightbox] : null;
  const { url: fullUrl, failed } = useMediaDataUrl(uid, current?.id ?? null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--app-muted)]">{scoped.length} photos</span>
        <div className="flex gap-1">
          <button className={scopeBtn(scope === "all")} onClick={() => onConfig({ scope: "all" })}>All</button>
          <button className={scopeBtn(scope === "world")} onClick={() => onConfig({ scope: "world" })}>This world</button>
        </div>
      </div>
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-3 content-start gap-1.5 overflow-y-auto">
        {scoped.length === 0 && (
          <p className="col-span-3 flex flex-col items-center gap-1.5 py-5 text-center text-[11px] text-[var(--app-muted)]">
            <ImageIcon className="h-6 w-6 text-fuchsia-400/70" />
            Import images in My Media to see them here.
          </p>
        )}
        {scoped.map((photo, i) =>
          photo.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.thumbnail}
              alt={photo.name}
              loading="lazy"
              onClick={() => setLightbox(i)}
              className="aspect-square w-full cursor-zoom-in rounded-lg border border-[var(--app-line)] object-cover transition-opacity hover:opacity-90"
            />
          ) : (
            <button
              key={photo.id}
              onClick={() => setLightbox(i)}
              className="flex aspect-square w-full cursor-zoom-in items-center justify-center rounded-lg border border-[var(--app-line)] bg-[var(--app-panel-2)] transition-opacity hover:opacity-85"
              aria-label={`Open ${photo.name}`}
            >
              <ImageIcon className="h-7 w-7 text-fuchsia-400/70" />
            </button>
          )
        )}
      </div>

      {lightbox !== null && scoped[lightbox] && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={scoped[lightbox].name} onClick={() => setLightbox(null)}>
          {fullUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fullUrl} alt={scoped[lightbox].name} className="max-h-full max-w-full rounded-xl object-contain" />
          ) : (
            <p className="text-xs text-white/70">{failed ? "Could not load this photo" : "Loading photo…"}</p>
          )}
          <button className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! - 1 + scoped.length) % scoped.length); }} aria-label="Previous photo"><ChevronLeft className="h-6 w-6" /></button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! + 1) % scoped.length); }} aria-label="Next photo"><ChevronRight className="h-6 w-6" /></button>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20" onClick={() => setLightbox(null)} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€ Video gallery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function VideosWidget({ widget, onConfig, media, worldId, uid }: WidgetProps) {
  const scope = (widget.config?.scope as string) ?? "all";
  const [active, setActive] = useState<MediaItem | null>(null);
  const scoped = useScopedMedia(media, worldId, scope).filter((m) => m.kind === "video");
  const { url: activeUrl, failed } = useMediaDataUrl(uid, active?.id ?? null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--app-muted)]">{scoped.length} videos</span>
        <div className="flex gap-1">
          <button className={scopeBtn(scope === "all")} onClick={() => onConfig({ scope: "all" })}>All</button>
          <button className={scopeBtn(scope === "world")} onClick={() => onConfig({ scope: "world" })}>This world</button>
        </div>
      </div>
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 content-start gap-1.5 overflow-y-auto">
        {scoped.length === 0 && (
          <p className="col-span-2 flex flex-col items-center gap-1.5 py-5 text-center text-[11px] text-[var(--app-muted)]">
            <Video className="h-6 w-6 text-orange-400/70" />
            Import videos in My Media to screen them here.
          </p>
        )}
        {scoped.map((video) => (
          <button key={video.id} onClick={() => setActive(video)} className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-[var(--app-line)] bg-black">
            <Video className="h-8 w-8 text-orange-400/80 transition-transform group-hover:scale-110" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/30 transition-transform group-hover:scale-110">
                <Play className="h-4 w-4 translate-x-[1px] text-white" />
              </span>
            </span>
            <span className="absolute bottom-1 left-1 right-1 truncate rounded bg-black/60 px-1.5 py-0.5 text-left text-[8px] font-semibold text-white">{video.name}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setActive(null)}>
          {activeUrl ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={activeUrl} controls autoPlay className="max-h-full max-w-full rounded-xl" onClick={(e) => e.stopPropagation()} />
          ) : (
            <p className="text-xs text-white/70">{failed ? "Could not load this video" : "Loading video…"}</p>
          )}
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20" onClick={() => setActive(null)} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€ File collection (PDF + documents) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function FilesWidget({ widget, onConfig, media, worldId, uid }: WidgetProps) {
  const scope = (widget.config?.scope as string) ?? "world";
  const scoped = useScopedMedia(media, worldId, scope).filter((m) => m.kind === "pdf" || m.kind === "document");
  const [busy, setBusy] = useState<string | null>(null);

  const download = async (file: MediaItem) => {
    setBusy(file.id);
    try {
      const url = await fetchMediaDataUrl(uid, file.id);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--app-muted)]">{scoped.length} files</span>
        <div className="flex gap-1">
          <button className={scopeBtn(scope === "all")} onClick={() => onConfig({ scope: "all" })}>All</button>
          <button className={scopeBtn(scope === "world")} onClick={() => onConfig({ scope: "world" })}>This world</button>
        </div>
      </div>
      <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
        {scoped.length === 0 && (
          <p className="flex flex-col items-center gap-1.5 py-5 text-center text-[11px] text-[var(--app-muted)]">
            <FileText className="h-6 w-6 text-slate-400/70" />
            PDFs and documents you attach to this world appear here.
          </p>
        )}
        {scoped.map((file) => (
          <div key={file.id} className="group flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-[var(--app-panel-2)]">
            <FileText className="h-4 w-4 shrink-0 text-rose-400/80" />
            <button onClick={() => void download(file)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[11px] font-semibold text-[var(--app-text)] hover:text-indigo-300">{file.name}</span>
              <span className="font-mono text-[8px] uppercase tracking-wider text-[var(--app-muted)]">{formatBytes(file.size)} · {timeAgo(file.createdAt)}</span>
            </button>
            <button onClick={() => void download(file)} disabled={busy === file.id} className="text-[var(--app-muted)] opacity-0 transition-opacity hover:text-[var(--app-text)] group-hover:opacity-100" aria-label={`Download ${file.name}`}>
              {busy === file.id ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" /> : <Download className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

