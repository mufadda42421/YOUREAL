import { LAST_WORLD_KEY } from "./utils";
import type { World } from "./types";

export interface RecentWorldEntry {
  id: string;
  name: string;
  icon: string;
  cover: string;
  accent: string;
  openedAt: number;
}

export function readRecentWorlds(uid: string): RecentWorldEntry[] {
  try {
    const raw = localStorage.getItem(LAST_WORLD_KEY(uid));
    if (!raw) return [];
    const list = JSON.parse(raw) as RecentWorldEntry[];
    return Array.isArray(list) ? list.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function touchRecentWorld(uid: string, world: Pick<World, "id" | "name" | "icon" | "cover" | "accent">) {
  try {
    const list = readRecentWorlds(uid).filter((w) => w.id !== world.id);
    list.unshift({ ...world, openedAt: Date.now() });
    localStorage.setItem(LAST_WORLD_KEY(uid), JSON.stringify(list.slice(0, 6)));
  } catch {
    /* ignore */
  }
}
