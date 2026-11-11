import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { getAccountDb } from "./config";
import type { UserProfile } from "@/lib/types";

const nowIso = () => new Date().toISOString();

export function profileRef(uid: string) {
  return doc(getAccountDb(uid), "users", uid);
}

export async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(profileRef(uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function createProfile(
  uid: string,
  email: string,
  fullName: string
): Promise<UserProfile> {
  const ts = nowIso();
  const profile: UserProfile = {
    uid,
    email,
    fullName,
    preferredName: fullName.split(" ")[0] ?? fullName,
    ageRange: "",
    location: "",
    occupation: "",
    bio: "",
    interests: [],
    preferences: {
      theme: "dark",
      language: "English",
      communicationStyle: "Balanced",
      responseLength: "Detailed",
      topics: [],
      dislikes: [],
      goals: [],
    },
    onboardingCompleted: false,
    avatarUrl: null,
    pin: null,
    createdAt: ts,
    updatedAt: ts,
  };
  await setDoc(profileRef(uid), profile);
  return profile;
}

export async function updateProfile(
  uid: string,
  patch: Partial<UserProfile>
): Promise<void> {
  await updateDoc(profileRef(uid), { ...patch, updatedAt: nowIso() });
}

export async function getOrCreateProfile(
  uid: string,
  email: string,
  fullName: string
): Promise<UserProfile> {
  const existing = await fetchProfile(uid).catch(() => null);
  if (existing) return existing;
  return createProfile(uid, email, fullName);
}

/** Recursively delete every document under a user's tree (best-effort, client-side). */
export async function deleteAllUserData(uid: string): Promise<void> {
  const db = getAccountDb(uid);
  const deleteCollection = async (path: string[]): Promise<void> => {
    // list documents at current path
    const colRef = collection(db, "users", uid, ...path);
    const snap = await getDocs(colRef).catch(() => null);
    if (!snap) return;
    for (const d of snap.docs) {
      await deleteDoc(d.ref).catch(() => {});
    }
  };

  // worlds (+ their widgets/notes/tasks/journal subcollections)
  const worlds = await getDocs(collection(db, "users", uid, "worlds")).catch(() => null);
  if (worlds) {
    for (const w of worlds.docs) {
      for (const sub of ["widgets", "notes", "tasks", "journal"]) {
        const subSnap = await getDocs(
          collection(db, "users", uid, "worlds", w.id, sub)
        ).catch(() => null);
        if (subSnap) {
          for (const s of subSnap.docs) await deleteDoc(s.ref).catch(() => {});
        }
      }
      await deleteDoc(w.ref).catch(() => {});
    }
  }
  // media (blob subcollection first, then the metadata docs)
  const mediaDocs = await getDocs(collection(db, "users", uid, "media")).catch(() => null);
  if (mediaDocs) {
    for (const m of mediaDocs.docs) {
      const blob = await getDocs(collection(db, "users", uid, "media", m.id, "blob")).catch(() => null);
      if (blob) {
        for (const b of blob.docs) await deleteDoc(b.ref).catch(() => {});
      }
      await deleteDoc(m.ref).catch(() => {});
    }
  }
  await deleteCollection(["folders"]);
  await deleteDoc(profileRef(uid)).catch(() => {});
}

export { serverTimestamp, writeBatch };
