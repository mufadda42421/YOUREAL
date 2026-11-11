// YOU — remove the disposable test accounts created during verification.
// All of them use password SmokePass1234 and are listed in the export filter below.
const { initializeApp, deleteApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} = require("firebase/firestore");
const fs = require("fs");

const raw = fs.readFileSync(".env.local", "utf8");
const cfg = Object.fromEntries(
  raw
    .split("\n")
    .filter((l) => l.startsWith("NEXT_PUBLIC_"))
    .map((l) => l.split("=").map((s) => s.trim()))
);

const firebaseConfig = {
  apiKey: cfg.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: cfg.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: cfg.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: cfg.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: cfg.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: cfg.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const exported = JSON.parse(fs.readFileSync(process.env.TEMP + "\\you-auth-users.json", "utf8"));
const testEmails = (exported.users || exported)
  .map((u) => u.email)
  .filter((e) => /^you-(smoke|probe|test|media)-.*@example\.com$/.test(e ?? ""));

console.log(`cleanup: ${testEmails.length} test accounts`);

const deleteCollection = async (db, path) => {
  const snap = await getDocs(collection(db, ...path)).catch(() => null);
  if (!snap) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (snap.docs.length) await batch.commit().catch(() => {});
};

(async () => {
  let ok = 0;
  let failed = 0;
  for (const email of testEmails) {
    const app = initializeApp(firebaseConfig, `cleanup_${Math.random().toString(36).slice(2)}`);
    try {
      const auth = getAuth(app);
      const cred = await signInWithEmailAndPassword(auth, email, "SmokePass1234");
      const uid = cred.user.uid;
      const db = getFirestore(app);

      // worlds + subcollections
      const worlds = await getDocs(collection(db, "users", uid, "worlds")).catch(() => null);
      if (worlds) {
        for (const w of worlds.docs) {
          for (const sub of ["widgets", "notes", "tasks", "journal"]) {
            await deleteCollection(db, ["users", uid, "worlds", w.id, sub]);
          }
          await deleteDoc(w.ref).catch(() => {});
        }
      }
      // media + blob subcollection + folders
      const media = await getDocs(collection(db, "users", uid, "media")).catch(() => null);
      if (media) {
        for (const m of media.docs) {
          await deleteCollection(db, ["users", uid, "media", m.id, "blob"]);
          await deleteDoc(m.ref).catch(() => {});
        }
      }
      await deleteCollection(db, ["users", uid, "folders"]);
      await deleteDoc(doc(db, "users", uid)).catch(() => {});
      await cred.user.delete();
      ok++;
      console.log("deleted", email);
    } catch (e) {
      failed++;
      console.log("FAILED ", email, "→", e?.code ?? e?.message ?? e);
    } finally {
      await deleteApp(app).catch(() => {});
    }
  }
  console.log(`\ncleanup done: ${ok} deleted, ${failed} failed`);
  process.exit(0);
})();
