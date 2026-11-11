"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  CloudFog,
  CloudSnow,
  CloudLightning,
} from "lucide-react";
import { cx } from "@/lib/utils";
import { inputSm, type WidgetProps } from "./common";
import { QUOTES } from "@/lib/constants";

/* ─── Calendar (events in widget config) ────────────────────────────────── */

interface CalEvent {
  id: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
}

export function CalendarWidget({ widget, onConfig }: WidgetProps) {
  const [view, setView] = useState(() => new Date());
  const events: CalEvent[] = (widget.config?.events as CalEvent[]) ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const year = view.getFullYear();
  const month = view.getMonth();
  const todayIso = new Date().toISOString().slice(0, 10);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // week starts Monday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: Array<{ iso: string; day: number | null }> = [];
    for (let i = 0; i < startOffset; i++) list.push({ iso: "", day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      list.push({ iso, day: d });
    }
    return list;
  }, [year, month]);

  const eventsOn = (iso: string) => events.filter((e) => e.date === iso);
  const selectedEvents = selected ? eventsOn(selected) : [];

  const addEvent = () => {
    const text = draft.trim();
    if (!text || !selected) return;
    onConfig({ events: [...events, { id: `ev_${Date.now()}`, date: selected, title: text }] });
    setDraft("");
  };

  const removeEvent = (id: string) => onConfig({ events: events.filter((e) => e.id !== id) });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <button onClick={() => setView(new Date(year, month - 1, 1))} className="rounded-lg p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-panel-2)]" aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-[12px] font-bold text-[var(--app-text)]">
          {view.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button onClick={() => setView(new Date(year, month + 1, 1))} className="rounded-lg p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-panel-2)]" aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-0.5 text-center font-mono text-[8px] font-bold uppercase text-[var(--app-muted)]">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <span key={d} className="py-1">{d}</span>)}
      </div>
      <div className="grid flex-1 grid-cols-7 content-start gap-0.5">
        {cells.map((cell, i) => cell.day === null ? (
          <span key={`x${i}`} />
        ) : (
          <button
            key={cell.iso}
            onClick={() => setSelected(selected === cell.iso ? null : cell.iso)}
            className={cx(
              "relative flex h-7 items-center justify-center rounded-md text-[10px] transition-all sm:h-8",
              cell.iso === todayIso && "bg-indigo-600 font-bold text-white",
              cell.iso !== todayIso && selected === cell.iso && "bg-indigo-500/25 text-indigo-300",
              cell.iso !== todayIso && selected !== cell.iso && "text-[var(--app-text)] hover:bg-[var(--app-panel-2)]"
            )}
            aria-label={cell.iso}
          >
            {cell.day}
            {eventsOn(cell.iso).length > 0 && (
              <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-cyan-400" />
            )}
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-2 border-t border-[var(--app-line)] pt-2">
          <div className="flex gap-1.5">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEvent()} placeholder={`Add event on ${selected.slice(5)}…`} className={inputSm} />
            <button onClick={addEvent} className="rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-500" aria-label="Add event"><Plus className="h-4 w-4" /></button>
          </div>
          <ul className="mt-1.5 max-h-20 overflow-y-auto">
            {selectedEvents.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between gap-2 py-0.5 text-[11px] text-[var(--app-text)]">
                <span className="truncate">• {ev.title}</span>
                <button onClick={() => removeEvent(ev.id)} className="text-[var(--app-muted)] hover:text-rose-400" aria-label="Delete event"><Trash2 className="h-3 w-3" /></button>
              </li>
            ))}
            {selectedEvents.length === 0 && <li className="py-0.5 text-[10px] text-[var(--app-muted)]">No events — add one above.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Clock ─────────────────────────────────────────────────────────────── */

export function ClockWidget() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="font-mono text-4xl font-bold tabular-nums leading-none text-[var(--app-text)] sm:text-5xl">
        {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        <span className="text-lg text-indigo-400">:{String(now.getSeconds()).padStart(2, "0")}</span>
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--app-muted)]">
        {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>
    </div>
  );
}

/* ─── Weather (Open-Meteo, no key) ──────────────────────────────────────── */

const WX_ICON = (code: number, cls: string) => {
  if (code === 0) return <Sun className={cls} />;
  if (code <= 2) return <CloudSun className={cls} />;
  if (code === 3) return <Cloud className={cls} />;
  if ([45, 48].includes(code)) return <CloudFog className={cls} />;
  if (code < 70) return <CloudRain className={cls} />;
  if (code < 90) return <CloudSnow className={cls} />;
  return <CloudLightning className={cls} />;
};

interface WxCurrent {
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
  relative_humidity_2m: number;
}

export function WeatherWidget({ widget, onConfig }: WidgetProps) {
  const city = (widget.config?.city as string) ?? "";
  const [draft, setDraft] = useState(city);
  const [wx, setWx] = useState<WxCurrent | null>(null);
  const [placeLabel, setPlaceLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city.trim()) {
      setWx(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const geo = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
          { signal: controller.signal }
        ).then((r) => (r.ok ? r.json() : null));
        const place = geo?.results?.[0];
        if (!place) {
          setError("City not found — try a nearby larger one.");
          setWx(null);
          return;
        }
        setPlaceLabel([place.name, place.country].filter(Boolean).join(", "));
        const data = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`,
          { signal: controller.signal }
        ).then((r) => (r.ok ? r.json() : null));
        setWx(data?.current ?? null);
      } catch {
        setError("Could not reach the weather service.");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [city]);

  const commitCity = () => onConfig({ city: draft.trim() });

  if (!city) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <CloudSun className="h-8 w-8 text-cyan-400" />
        <p className="text-[11px] text-[var(--app-muted)]">Which city should I watch?</p>
        <div className="flex w-full gap-1.5">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commitCity()} placeholder="Lisbon…" className={inputSm} autoFocus />
          <button onClick={commitCity} className="rounded-lg bg-indigo-600 px-3 text-white" aria-label="Set city"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-[11px] text-rose-400">{error}</p>
        <button onClick={() => onConfig({ city: "" })} className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300">Choose another city</button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="flex items-center gap-4">
        {loading ? (
          <div className="skeleton h-16 w-16 rounded-2xl" />
        ) : (
          WX_ICON(wx?.weather_code ?? 0, "h-16 w-16 text-amber-400")
        )}
        <div className="text-left">
          <p className="font-mono text-4xl font-bold leading-none text-[var(--app-text)]">
            {wx ? Math.round(wx.temperature_2m) : "—"}°
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">{placeLabel || city}</p>
        </div>
      </div>
      {wx && (
        <div className="mt-3 flex gap-3 font-mono text-[9px] uppercase tracking-wider text-[var(--app-muted)]">
          <span>Feels {Math.round(wx.apparent_temperature)}°</span>
          <span>·</span>
          <span>{Math.round(wx.relative_humidity_2m)}% RH</span>
          <span>·</span>
          <span>{Math.round(wx.wind_speed_10m)} km/h</span>
        </div>
      )}
      <button onClick={() => onConfig({ city: "" })} className="mt-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)] hover:text-[var(--app-text)]">
        Change city
      </button>
    </div>
  );
}

/* ─── Quotes ────────────────────────────────────────────────────────────── */

export function QuotesWidget({ widget, onConfig }: WidgetProps) {
  const offset = Number(widget.config?.offset ?? 0);
  const idx = ((Math.floor(Date.now() / 86400000) + offset) % QUOTES.length + QUOTES.length) % QUOTES.length;
  const quote = QUOTES[idx];

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="text-[12px] font-medium leading-relaxed text-[var(--app-text)]">“{quote.text}”</p>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--app-muted)]">{quote.author}</p>
      <button onClick={() => onConfig({ offset: offset + 1 })} className="mt-2 rounded-full border border-[var(--app-line)] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--app-muted)] transition-colors hover:border-indigo-500/40 hover:text-indigo-300">
        Next signal
      </button>
    </div>
  );
}

/* ─── Countdown ─────────────────────────────────────────────────────────── */

interface Countdown {
  id: string;
  label: string;
  date: string;
}

export function CountdownWidget({ widget, onConfig }: WidgetProps) {
  const countdowns: Countdown[] = (widget.config?.countdowns as Countdown[]) ?? [];
  const [now, setNow] = useState(() => Date.now());
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const next = countdowns.filter((c) => new Date(c.date).getTime() > now).sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];

  const add = () => {
    if (!label.trim() || !date) return;
    onConfig({ countdowns: [...countdowns, { id: `cd_${Date.now()}`, label: label.trim(), date }] });
    setLabel("");
    setDate("");
    setAdding(false);
  };

  const remove = (id: string) => onConfig({ countdowns: countdowns.filter((c) => c.id !== id) });

  const remaining = next ? Math.max(0, Math.floor((new Date(next.date).getTime() - now) / 1000)) : null;
  const parts = remaining !== null ? {
    d: Math.floor(remaining / 86400),
    h: Math.floor((remaining % 86400) / 3600),
    m: Math.floor((remaining % 3600) / 60),
    s: remaining % 60,
  } : null;

  return (
    <div className="flex h-full flex-col">
      {next && parts ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="max-w-full truncate text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--app-muted)]">{next.label}</p>
          <div className="mt-2 flex items-end gap-2">
            {[
              [parts.d, "days"], [parts.h, "hrs"], [parts.m, "min"], [parts.s, "sec"],
            ].map(([value, unit]) => (
              <div key={unit as string} className="flex flex-col items-center">
                <span className="rounded-xl border border-[var(--app-line)] bg-[var(--app-panel-2)] px-2.5 py-2 font-mono text-xl font-bold tabular-nums text-indigo-300 sm:text-2xl">
                  {String(value).padStart(2, "0")}
                </span>
                <span className="mt-1 text-[8px] font-bold uppercase tracking-widest text-[var(--app-muted)]">{unit as string}</span>
              </div>
            ))}
          </div>
          <button onClick={() => remove(next.id)} className="mt-2 text-[9px] uppercase tracking-[0.2em] text-[var(--app-muted)] hover:text-rose-400">Remove</button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[11px] text-[var(--app-muted)]">Nothing on the horizon.</p>
        </div>
      )}

      {adding ? (
        <div className="mt-2 space-y-1.5 border-t border-[var(--app-line)] pt-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Launch day, birthday…" className={inputSm} autoFocus />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputSm} aria-label="Countdown date" />
          <div className="flex gap-1.5">
            <button onClick={add} className="btn btn-primary flex-1 !py-1.5 text-[11px]">Add</button>
            <button onClick={() => setAdding(false)} className="btn btn-ghost flex-1 !py-1.5 text-[11px]"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--app-line)] py-1.5 text-[10px] font-semibold text-[var(--app-muted)] transition-colors hover:border-indigo-500/40 hover:text-indigo-300">
          <Plus className="h-3 w-3" /> New countdown
        </button>
      )}
    </div>
  );
}
