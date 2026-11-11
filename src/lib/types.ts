// ─── YOU · shared type definitions ───────────────────────────────────────────

export type ThemePreference = "light" | "dark" | "system";

export interface UserPreferences {
  theme: ThemePreference;
  language: string;
  communicationStyle: string;
  responseLength: string;
  topics: string[];
  dislikes: string[];
  goals: string[];
}

export interface PinVerifier {
  enabled: boolean;
  /** PBKDF2-SHA256 */
  iterations: number;
  salt: string; // hex
  hash: string; // hex
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  preferredName: string;
  ageRange: string;
  location: string;
  occupation: string;
  bio: string;
  interests: string[];
  preferences: UserPreferences;
  onboardingCompleted: boolean;
  avatarUrl: string | null;
  pin: PinVerifier | null;
  createdAt: string;
  updatedAt: string;
}

export type WidgetType =
  | "notes"
  | "tasks"
  | "calendar"
  | "clock"
  | "weather"
  | "music"
  | "photos"
  | "videos"
  | "bookmarks"
  | "goals"
  | "quotes"
  | "countdown"
  | "quicklinks"
  | "files"
  | "journal";

export type WidgetSize = "sm" | "md" | "lg" | "xl";

export interface WorldWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  order: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface World {
  id: string;
  name: string;
  description: string;
  icon: string;
  cover: string; // cover preset id or URL
  background: string; // background preset id
  accent: string; // hex accent color
  pinned: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  mood: string;
  createdAt: string;
}

export type MediaKind = "image" | "video" | "audio" | "pdf" | "document" | "other";

export interface MediaItem {
  id: string;
  name: string;
  kind: MediaKind;
  mimeType: string;
  size: number;
  storagePath: string;
  /** Full base64 data URL — present only for freshly-uploaded (in-memory) items, never persisted. */
  url?: string;
  worldId: string | null;
  folderId: string | null;
  createdAt: string;
  /** Small inline JPEG thumbnail (image kind only), stored with the metadata doc. */
  thumbnail?: string | null;
}

export interface MediaFolder {
  id: string;
  name: string;
  worldId: string | null;
  createdAt: string;
}

/** Device-local remembered account — identifiers ONLY. Never credentials. */
export interface RememberedAccount {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  pinEnabled: boolean;
  lastUsedAt: number;
}
