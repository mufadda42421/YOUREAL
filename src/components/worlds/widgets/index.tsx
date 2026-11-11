"use client";

import type { WidgetProps } from "./common";
import { NotesWidget, TasksWidget, JournalWidget } from "./NoteTaskWidgets";
import { CalendarWidget, ClockWidget, WeatherWidget, QuotesWidget, CountdownWidget } from "./InfoWidgets";
import { GoalsWidget, BookmarksWidget, QuickLinksWidget } from "./ListWidgets";
import { MusicWidget, PhotosWidget, VideosWidget, FilesWidget } from "./MediaWidgets";
import type { WidgetType } from "@/lib/types";

export function WidgetRenderer(props: WidgetProps) {
  const type = props.widget.type;
  switch (type) {
    case "notes": return <NotesWidget {...props} />;
    case "tasks": return <TasksWidget {...props} />;
    case "calendar": return <CalendarWidget {...props} />;
    case "clock": return <ClockWidget />;
    case "weather": return <WeatherWidget {...props} />;
    case "music": return <MusicWidget {...props} />;
    case "photos": return <PhotosWidget {...props} />;
    case "videos": return <VideosWidget {...props} />;
    case "bookmarks": return <BookmarksWidget {...props} />;
    case "goals": return <GoalsWidget {...props} />;
    case "quotes": return <QuotesWidget {...props} />;
    case "countdown": return <CountdownWidget {...props} />;
    case "quicklinks": return <QuickLinksWidget {...props} />;
    case "files": return <FilesWidget {...props} />;
    case "journal": return <JournalWidget {...props} />;
    default:
      return (
        <p className="py-6 text-center text-[11px] text-[var(--app-muted)]">
          Unknown widget type — remove it from the settings menu.
        </p>
      );
  }
}

export type { WidgetType };
