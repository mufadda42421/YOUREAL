"use client";

import {
  StickyNote,
  CheckSquare,
  CalendarDays,
  Clock3,
  CloudSun,
  Music,
  Image as ImageIcon,
  Video,
  Bookmark,
  Target,
  Quote,
  Timer,
  LayoutGrid,
  FileText,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import type { WidgetType } from "@/lib/types";

export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  description: string;
  Icon: LucideIcon;
  tint: string;
}

export const WIDGET_LIBRARY: WidgetDefinition[] = [
  { type: "notes", title: "Notes", description: "Capture and pin quick thoughts", Icon: StickyNote, tint: "text-amber-400 bg-amber-500/10" },
  { type: "tasks", title: "Tasks", description: "Create, complete and clear to-dos", Icon: CheckSquare, tint: "text-emerald-400 bg-emerald-500/10" },
  { type: "calendar", title: "Calendar", description: "See your month and key dates", Icon: CalendarDays, tint: "text-sky-400 bg-sky-500/10" },
  { type: "clock", title: "Clock", description: "A calm, always-visible timepiece", Icon: Clock3, tint: "text-indigo-400 bg-indigo-500/10" },
  { type: "weather", title: "Weather", description: "Live conditions for any city", Icon: CloudSun, tint: "text-cyan-400 bg-cyan-500/10" },
  { type: "music", title: "Music", description: "Play your uploaded audio", Icon: Music, tint: "text-rose-400 bg-rose-500/10" },
  { type: "photos", title: "Photo Gallery", description: "Your images, beautifully tiled", Icon: ImageIcon, tint: "text-fuchsia-400 bg-fuchsia-500/10" },
  { type: "videos", title: "Video Gallery", description: "Your videos, ready to play", Icon: Video, tint: "text-orange-400 bg-orange-500/10" },
  { type: "bookmarks", title: "Bookmarks", description: "The links you actually return to", Icon: Bookmark, tint: "text-teal-400 bg-teal-500/10" },
  { type: "goals", title: "Daily Goals", description: "Small promises, kept daily", Icon: Target, tint: "text-lime-400 bg-lime-500/10" },
  { type: "quotes", title: "Quotes", description: "A daily line worth keeping", Icon: Quote, tint: "text-violet-400 bg-violet-500/10" },
  { type: "countdown", title: "Countdown", description: "To launch days and birthdays", Icon: Timer, tint: "text-red-400 bg-red-500/10" },
  { type: "quicklinks", title: "Quick Links", description: "Your shortcuts to everywhere", Icon: LayoutGrid, tint: "text-blue-400 bg-blue-500/10" },
  { type: "files", title: "File Collection", description: "Documents and PDFs at hand", Icon: FileText, tint: "text-slate-400 bg-slate-500/10" },
  { type: "journal", title: "Journal", description: "Private entries, honestly written", Icon: PenLine, tint: "text-pink-400 bg-pink-500/10" },
];

export const widgetDefinition = (type: WidgetType): WidgetDefinition =>
  WIDGET_LIBRARY.find((w) => w.type === type) ?? WIDGET_LIBRARY[0];
