# YOU — Your World. Your Way.

> An all-in-one **personal digital universe**. The homepage introduces the product; signing in opens your private home; onboarding teaches YOU who you are; Firebase remembers; your dashboard becomes your own room on the internet.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Firebase (Auth + Cloud Firestore, free tier) · lucide-react · Framer Motion · dnd-kit**.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your Firebase web app keys
npm run dev                  # http://localhost:3000
```

Production check:

```bash
npm run build
npm start
```

### Required Firebase setup (one time)

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method** → enable **Email/Password** only (no OAuth — by design).
3. **Create database → Cloud Firestore** (production mode).
4. **Cloud Firestore** — create the database (production mode). Storage is **not** required; media lives in Firestore (free tier).
5. **Project Settings → General → Your apps → Web** → copy the config into `.env.local`.
6. Deploy the security rules (they encode the entire privacy model):

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add <your-project-id>
   firebase deploy --only auth,firestore:rules
   ```

   Or paste `firestore.rules` into the **Firestore → Rules** tab in the console.

Without `.env.local` the app still builds and renders, but the authenticated area shows a clear "Firebase isn't configured yet" screen instead of pretending to work.

---

## What the app contains

### Public
| Route | Purpose |
| --- | --- |
| `/` | Premium landing page — hero, features, how-it-works, worlds showcase, FAQ, footer. Sign In / Get Started open polished modals (`/?auth=signin|signup|reset` deep-links supported). |
| `/privacy`, `/terms` | Real, concise legal pages (footer links work). |

### Authenticated (route-guarded, redirects to `/?auth=signin&next=<path>`)
| Route | Purpose |
| --- | --- |
| `/onboarding` | 4-step wizard — Basic info → Interests → Preferences → **optional PIN**. Progress indicator, back/skip, saves to Firestore, marked `onboardingCompleted` so returning users never see it again. |
| `/dashboard` | **My Home** — live clock, weather (Open-Meteo, no key needed), greeting, recently-opened & pinned worlds, recent media, interest-shaped suggestions, open-tasks aggregator, customizable sections. |
| `/worlds` | **My Worlds** — search, sort, pin, set default, duplicate, delete, create. |
| `/worlds/[id]` | A world — custom icon/cover/background/accent, **drag-and-drop widget grid** (dnd-kit), resize (sm→xl), 15 fully-functional widgets, auto-persisted layout. |
| `/media` | **My Media** — drag-and-drop upload with progress, folders, search/sort/filter, grid/list, multi-select (bulk download/move/attach-to-world/delete), preview (images, video, audio, PDF iframe). |
| `/profile` | Avatar upload, identity hero, stats (worlds/media/tasks/interests), constellation. |
| `/settings` | Profile, Interests, Preferences (incl. **light/dark/system theme**, instant-apply), Security (password re-auth change, **PIN enable/change/disable** with current-PIN verification), Account (JSON export, sign out, **account deletion** with password + typed confirmation). |

### Security model, in one paragraph

Authentication is **email + password only**. Every account gets its own Firestore profile under `users/{uid}` and its media (base64 data URLs + thumbnails) in `users/{uid}/media/...` — no Cloud Storage needed. `firestore.rules` enforce owner-only access everywhere, including the media blob subcollection. Multiple accounts can be *remembered* on a device via a localStorage list of **identifiers only** (uid/email/name/avatar/pin flag — never passwords or tokens). Switching to a remembered account restores its session through the Firebase SDK's own per-app persistence, and a PIN (PBKDF2-SHA256, 120k iterations, salted) locks the view until entered. Five wrong PINs trigger a 30s → 2min → 10min lockout. The PIN is a shared-device privacy layer, **not** an authentication factor — data is protected by Firebase Auth + rules regardless.

---

## Multi-account design

Sign-in goes through a dedicated named Firebase app per account (`you_account_<uid>`); the Firebase SDK persists each session under its own key. A device-local list (`you_remembered_accounts`) holds only identifiers. The account switcher (sidebar bottom) shows remembered accounts with avatars, allows switching (with PIN gate when enabled), removing one from the device, and adding another without destroying existing sessions. Deleting/signing out affects only the active account. One Firebase session is the source of truth; our storage never holds credentials.

## Widgets (all functional, persisted per world)

Notes (Firestore CRUD + pin) · Tasks (CRUD + complete) · Calendar (month view, events in widget config) · Clock · Weather (Open-Meteo) · Music (plays your uploaded audio + pinned stream URLs; seek/skip/mute) · Photo Gallery (lightbox, scope: world/all) · Video Gallery (modal player) · Bookmarks (config links) · Daily Goals (conic-progress checklist) · Quotes · Countdown (live) · Quick Links · File Collection (PDFs/docs from My Media) · Journal (entries + moods).

Layout: `@dnd-kit/sortable` grid, order + size persisted to `users/{uid}/worlds/{worldId}/widgets/{widgetId}` on every drag/resize. Notes/tasks/journal live in subcollections. Calendar/goals/bookmarks/countdowns/quick-links persist in widget `config`.

## Project structure

```
src/
  app/
    page.tsx                     # homepage (server → Suspense → client)
    layout.tsx                   # fonts, theme bootstrap, providers
    privacy/ terms/              # legal
    onboarding/                  # onboarding wizard
    (app)/                       # authenticated group (server layout + Suspense)
      layout.tsx  dashboard/  worlds/  worlds/[id]/  media/  profile/  settings/
  components/
    providers/  AppProvider.tsx (multi-account auth)  Toast.tsx
    auth/       AuthModal.tsx
    home/       HomeNav / HomeHero / HomeSections / HomeFooter / HomeExperience
    app/        AppShell (sidebar + account switcher + collapse)  ProtectedShell  PinUnlockScreen  WeatherChip
    worlds/     WorldFormModal  WidgetLibrary  WidgetShell  widgets/ (15)
    ui/         Modal  Dropdown  Avatar  Logo  ChipEditor
  lib/
    firebase/   config.ts (multi-app)  profile.ts  worlds.ts (all CRUD)
    pin.ts        # PBKDF2 verify + device-local rate limiting
    remembered.ts # identifiers-only device storage
    validation.ts # forms + Firebase error mapping
    constants.ts types.ts utils.ts hooks.ts
firestore.rules  storage.rules (optional)  firestore.indexes.json  firebase.json  .env.example
```

## Honest limitations & notes

- **Marketing landing page is a deliberate dark canvas** (like the reference youareyou.vercel.app); the authenticated app supports light/dark/system.
- **No OAuth** anywhere — email/password only, per the spec.
- Weather uses **Open-Meteo** (free, no API key, no signup). City comes from your profile location or the widget's own setting.
- Account deletion removes every Firestore document you own (profile, worlds, widgets, subcollections, media, folders) and then your Auth user (requires a recent sign-in; the UI asks for your password first).
- Media files are capped at ~700 KB (Firestore's 1 MB document limit). Images are auto-thumbnailed to ~10–30 KB for instant grids. Large videos and big libraries exceed the free tier — enable Firebase Storage (Blaze plan) to lift the cap, or pin videos via URL.
- Admin SDK is intentionally **absent** — all privileged work happens via security rules, never via credentials in the client.
- Export (`Settings → Account`) produces a portable JSON of everything you own.

## Troubleshooting

- **"Firebase isn't configured yet"** — create `.env.local` from `.env.example`, restart `npm run dev`.
- **`auth/invalid-credential`** for an existing user — Firebase now returns this for both wrong password and unknown email (privacy); YOU maps it to "Incorrect email or password."
- **Rules permission-denied** — deploy `firestore.rules` (see Quick start).
- **`npm run build` warns about client hooks/prerender** — this app is fully client-side after a static shell; all pages prerender as static content and gate behind client auth/PIN state.
