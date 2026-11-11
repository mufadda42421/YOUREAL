"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudSun,
  Loader2,
  MapPin,
} from "lucide-react";

interface WeatherState {
  tempC: number;
  code: number;
  city: string;
}

const codeLabel = (code: number): { label: string; Icon: typeof Sun } => {
  if (code === 0) return { label: "Clear sky", Icon: Sun };
  if (code === 1 || code === 2) return { label: "Partly cloudy", Icon: CloudSun };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "Foggy", Icon: CloudFog };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", Icon: CloudRain };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Rain", Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snow", Icon: CloudSnow };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", Icon: CloudLightning };
  return { label: "Cloudy", Icon: Cloud };
};

/** Live weather via Open-Meteo (no API key required). Hides silently on failure. */
export function WeatherChip({ location }: { location: string }) {
  const [state, setState] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(Boolean(location.trim()));

  useEffect(() => {
    const city = location.trim();
    if (!city) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const geo = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
          { signal: controller.signal }
        ).then((r) => (r.ok ? r.json() : null));
        const place = geo?.results?.[0];
        if (!place) {
          setState(null);
          return;
        }
        const wx = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=auto`,
          { signal: controller.signal }
        ).then((r) => (r.ok ? r.json() : null));
        const current = wx?.current;
        if (current) {
          setState({
            tempC: Math.round(current.temperature_2m),
            code: current.weather_code,
            city: place.name,
          });
        }
      } catch {
        setState(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [location]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--app-line)] bg-[var(--app-panel)] px-3 py-1.5 text-[11px] font-semibold text-[var(--app-muted)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Weather…
      </span>
    );
  }
  if (!state) return null;

  const { label, Icon } = codeLabel(state.code);
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-[var(--app-line)] bg-[var(--app-panel)] px-3 py-1.5 text-[11px] font-semibold text-[var(--app-text)]"
      title={`${label} in ${state.city}`}
    >
      <Icon className="h-4 w-4 text-amber-400" />
      {state.tempC}°C
      <span className="flex items-center gap-1 font-normal text-[var(--app-muted)]">
        <MapPin className="h-3 w-3" />
        {state.city}
      </span>
    </span>
  );
}
