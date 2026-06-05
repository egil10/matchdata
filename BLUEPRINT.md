# Matchdata Blueprint

A deep, portable spec for **Matchdata** — an advanced-statistics site for Norwegian
football (Eliteserien, OBOS-ligaen, Toppserien and the lower divisions, down to
the grassroots). Drop this file into a fresh repo and hand it to a coding agent:
it captures the design system, the two-tier data architecture, the build-time
generation pipeline, the performance playbook, the data-honesty rules, every
pitfall worth avoiding, and the owner's working preferences — so rebuilding (or
re-skinning to another league/sport) is mostly assembly.

> **How to use this doc.** Keep the **design system** (§3) and **architecture**
> (§4–§7) close to verbatim. Swap the **data model + pipeline** (§5) for your
> sport/league. The personality lives in §3; the speed lives in §6–§7; the
> data-honesty contract lives in §8; the don't-repeat-our-mistakes lives in §10.
> Read §12 (preferences) before any judgment call.

---

## Table of contents

1. What this is
2. Tech stack & file map
3. Design system (copy verbatim)
4. Architecture: two data tiers
5. Data model & generation pipeline
6. Performance playbook
7. Caching & versioning
8. Data honesty (the core promise)
9. Gender & theme systems
10. Pitfalls & hard-won lessons
11. Deployment
12. Owner's working style & preferences
13. Re-skinning checklist
14. Quick-reference cheatsheet

---

## 1. What this is

A **statically-generated football analytics site**. Real results and league
tables (public-domain openfootball data) are combined with a clearly-labelled
**modeled** player layer (squads, minutes, on-pitch +/−, an Elo-flavoured "Team
Impact" metric, age profiles). It's a browse-and-analyse experience, not a live
scoreboard: deep league/team/player/match pages plus interactive "labs"
(scatter explorer, age lab, cross-tabs, team comparison).

The feelings to preserve, in priority order:

1. **Instant.** Almost everything is prerendered to static HTML at build time.
   Heavy interactive datasets stream from immutable-cached JSON and are held in a
   module-level cache so route changes never refetch.
2. **Calm, editorial, data-dense.** Frosted translucent glass floating over a
   warm-paper gradient; generous radii; restrained colour; `tabular-nums`
   everywhere numbers live so tables don't jitter.
3. **Honest.** Real data and modeled data are *always* visually distinguished
   (see §8). We never dress up an estimate as an official number.
4. **Bilingual-by-toggle (men/women) and dark/light** without a flash or a
   layout jump.
5. **Keyboard-first search.** `⌘K` / `Ctrl-K` opens a command palette over the
   whole dataset.

The UI language is **Norwegian (bokmål)**; locale-aware sorting (`localeCompare(…, "nb")`)
and number/date formatting (`Intl.*` with `nb-NO`) are used throughout.

---

## 2. Tech stack & file map

- **Next.js 14 (App Router)** + **React 18**, **TypeScript** (strict-ish; build
  ignores type/lint errors so a red squiggle never blocks a deploy — validate
  manually, see §14).
- **Tailwind CSS 3** + a small token/component layer in `globals.css` (§3).
- **lucide-react** for all icons. **No emojis in the UI, ever.** No raw unicode
  glyphs as iconography either (no `★`/`▲`) — use a lucide component so weight,
  size and colour are controllable.
- **recharts** for rich charts, **lazy-loaded** so it's never in the first load
  (§6). A second, dependency-free `dataviz.tsx` covers inline SVG/CSS viz.
- **next/font/google**: `Inter` (body) + `Syne` (display/wordmark only).
- **No backend, no database.** All data is static JSON generated at build time.
  Per-device state (favourites, theme, gender) lives in cookies / `localStorage`.
- **Deploys to Vercel**, fully static. Pushing `main` auto-deploys.

```
scripts/
  generate.mjs            # THE pipeline: real + modeled → all JSON datasets (runs on predev & build)
  fetch-2026.mjs          # pull live 2026 fixtures/tables (TheSportsDB) into cache/
  fetch-real.mjs          # pull openfootball results/history into cache/
  fetch-logos.mjs         # pull club crests (Wikidata/TheSportsDB) into cache/
  shots.mjs               # Playwright screenshots of every route (.shots/)
  lib/{metrics,prng,sources}.mjs   # shared maths, seeded RNG, club/source tables
  cache/                  # committed raw-source cache (openfootball, thesportsdb, wikidata, wikipedia)
src/
  app/
    layout.tsx            # root html/body, fonts, metadata, the no-FOUC theme script, Header/Footer/Palette
    globals.css           # design tokens + component classes (the design system)
    page.tsx              # home (server component)
    {ligaer,spillere,kamper,analyse,utforsk,landslag,alder,overganger,sammenlign,favoritter,om}/page.tsx
    liga/[id]/  lag/[id]/  spiller/[id]/  kamp/[id]/page.tsx   # SSG detail pages (generateStaticParams)
    loading.tsx  not-found.tsx  icon.svg
  components/
    layout/{header,footer,command-palette,gender-toggle,theme-toggle}.tsx
    ui/{primitives,controls,tabs}.tsx     # Card/Badge/Stat/PageHeader · Select/Segmented/SortHeader/Collapsible · Tabs
    charts.tsx            # all recharts components ("use client")
    charts-lazy.tsx       # next/dynamic wrappers (ssr:false) → recharts loads only on mount
    dataviz.tsx           # dependency-free SVG/CSS viz (BoxPlot, Heatmap, MiniHist, DivergeBar, SegBar)
    widgets.tsx  tables.tsx  transfers-list.tsx  fav-button.tsx  brand/logo.tsx
  data/generated/*.json   # FULL datasets — imported by server components only (multi-MB)
  lib/
    db.ts                 # SERVER data layer: static-imports generated JSON, exposes typed accessors
    client.ts             # CLIENT data layer: useJson() hooks fetch trimmed public/data JSON
    types.ts              # the canonical domain types (League/Team/Player/Fixture/MatchDetail/…)
    metrics.ts colors.ts format.ts stats.ts matches.ts gender.ts nav.ts cn.ts use-favorites.ts
public/data/*.json        # TRIMMED client datasets (players/teams/leagues/fixtures/search/meta)
next.config.mjs           # immutable cache headers for /data/*, DATA_VERSION env, package-import optim
```

---

## 3. Design system (copy verbatim)

The whole visual identity is ~180 lines of CSS + a Tailwind token map. Reproduce
both and you have the look.

### 3.1 Identity in one sentence

**Warm-paper glass + pills.** Translucent frosted surfaces (`glass`,
`glass-strong`, `card-surface`) floating over a near-white paper background lit
by one warm and one cool radial glow; pill-shaped controls; restrained colour;
generous radii (`--radius: 1.1rem`); icons from lucide only.

### 3.2 Colour — HSL design tokens

All colour is **HSL channel triplets in CSS variables**, consumed as
`hsl(var(--x))` (and `hsl(var(--x) / .5)` for alpha). Tailwind's theme maps
semantic names (`background`, `foreground`, `card`, `muted`, `primary`,
`accent`, `border`, …) onto these, so every utility (`bg-card`, `text-muted-foreground`)
is theme-aware. Light is the **default identity** (warm paper); `.dark` on
`<html>` swaps the whole palette to a deep cool slate.

```css
:root {
  --radius: 1.1rem;
  /* Light — warm paper (default identity) */
  --background: 44 32% 97%;   --foreground: 0 0% 7%;
  --card: 0 0% 100%;          --card-foreground: 0 0% 7%;
  --popover: 42 40% 99%;      --popover-foreground: 0 0% 7%;
  --muted: 40 18% 93%;        --muted-foreground: 220 9% 42%;
  --border: 36 18% 87%;       --input: 36 18% 84%;
  --primary: 211 90% 44%;     --primary-foreground: 0 0% 100%;   /* football blue */
  --accent: 262 72% 56%;      --accent-foreground: 0 0% 100%;    /* violet */
  --ring: 211 90% 44%;
  --success: 152 56% 36%;     --danger: 352 72% 47%;   --warning: 30 92% 44%;
  --chart-1..6: …;            /* 6-colour categorical chart ramp */
  --glass-bg: rgba(255,255,255,.6);   --glass-strong: rgba(255,255,255,.8);
  --glass-stroke: rgba(255,255,255,.75);
  --glass-shadow: 0 1px 2px rgba(20,20,30,.04), 0 14px 36px -16px rgba(20,20,40,.22);
}
.dark {
  --background: 224 30% 8%;   --foreground: 210 22% 96%;   --card: 224 26% 11%;
  --muted: 222 18% 17%;       --muted-foreground: 216 14% 64%;   --border: 220 16% 20%;
  --primary: 205 95% 58%;     --accent: 263 90% 72%;
  --glass-bg: rgba(30,34,44,.55);   --glass-strong: rgba(28,32,42,.72);
  --glass-stroke: rgba(255,255,255,.07);
  --glass-shadow: 0 1px 2px rgba(0,0,0,.3), 0 18px 44px -18px rgba(0,0,0,.6);
  /* …full set mirrors :root… */
}
```

Colour discipline: almost everything is `foreground` on `background`/`card`;
`text-muted-foreground` for secondary text; `primary` (blue) for links/active,
`accent` (violet) sparingly; semantic green/amber/rose **only** for
tone (`good`/`low`/`bad`, real-vs-modeled, win/draw/loss). Tones are centralised
in `lib/metrics.ts` (`TONE_TEXT`, `TONE_BG`) so a metric's colour is one lookup.

### 3.3 Fonts

Loaded via `next/font/google` in `layout.tsx`, exposed as CSS variables:

```tsx
import { Inter, Syne } from "next/font/google";
const inter   = Inter({ subsets:["latin"], variable:"--font-sans",    display:"swap" });
const display = Syne ({ subsets:["latin"], variable:"--font-display", display:"swap", weight:["700","800"] });
// <html className={cn(inter.variable, display.variable)}>  <body className="font-sans antialiased">
```

- **Inter** is the body/UI face (the whole app). `font-feature-settings` enables
  a few stylistic sets (`cv02 cv03 cv11 ss01`) for a slightly more characterful
  Inter.
- **Syne** (geometric, artsy, modern) is the **display face — wordmark only**.
  On-brand alternates if reskinning: Space Grotesk, Fraunces, Instrument Serif.
- Headings use `tracking-tight` (set in `@layer base`); tiny labels are
  `text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`.
- Numbers use **`tabular-nums`** (`.stat-num` helper) so tables/stats don't jitter.

### 3.4 The glass + pill component layer (verbatim)

```css
@layer components {
  .container-page { @apply container mx-auto px-4 sm:px-6; }

  /* Frosted floating surfaces. `glass` = pills/bars, `glass-strong`/`card-surface` = cards. */
  .glass        { background: var(--glass-bg);     backdrop-filter: saturate(180%) blur(16px); border: 1px solid var(--glass-stroke); box-shadow: var(--glass-shadow); }
  .glass-strong { background: var(--glass-strong); backdrop-filter: saturate(180%) blur(20px); border: 1px solid var(--glass-stroke); box-shadow: var(--glass-shadow); }
  .card-surface { @apply rounded-2xl text-card-foreground; background: var(--glass-strong); backdrop-filter: saturate(180%) blur(20px); border: 1px solid var(--glass-stroke); box-shadow: var(--glass-shadow); }
  /* (each `backdrop-filter` is paired with a `-webkit-` prefix in the real file) */

  .stat-num    { font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
  .text-gradient { @apply bg-clip-text text-transparent; background-image: linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent))); }
  .glass-bar   { background: hsl(var(--background) / 0.6); backdrop-filter: saturate(180%) blur(14px); }
  .focus-ring  { @apply outline-none focus-visible:ring-2 focus-visible:ring-ring; }
  .link-underline { @apply underline-offset-4 hover:underline; }
  .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { scrollbar-width: none; }
}

/* Decorative backdrops used on hero sections. */
.bg-grid { background-image: linear-gradient(to right, hsl(var(--border)/.6) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/.6) 1px, transparent 1px); background-size: 38px 38px; mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 38%, transparent 100%); }
.bg-glow { background: radial-gradient(50% 50% at 20% 0%, hsl(var(--primary)/.14), transparent 70%), radial-gradient(45% 45% at 85% 10%, hsl(var(--accent)/.14), transparent 70%); }

/* Thin floating-capsule scrollbars + tinted selection. */
::-webkit-scrollbar { width: 11px; height: 11px; }
::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground)/.3); border-radius: 9999px; border: 3px solid transparent; background-clip: padding-box; }
* { scrollbar-width: thin; scrollbar-color: hsl(var(--muted-foreground)/.3) transparent; }
::selection { background: hsl(var(--primary)/.22); }
```

### 3.5 The signature backdrop (perf-critical — read this)

The warm/cool glow is rendered on a **fixed, GPU-isolated pseudo-element**, NOT
with `background-attachment: fixed`. The latter forces a full-page repaint on
every scroll frame (visibly janky on mobile); a fixed `body::before` is painted
once and composited.

```css
body { color: hsl(var(--foreground)); background: hsl(var(--background)); -webkit-font-smoothing: antialiased; }
body::before {
  content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(1100px 560px at 82% -8%, #ffeedd 0%, transparent 60%),
    radial-gradient(880px 520px at 6% 100%, #e6ecff 0%, transparent 55%);
}
.dark body::before {
  background:
    radial-gradient(1100px 560px at 82% -8%, rgba(56,84,150,.20) 0%, transparent 60%),
    radial-gradient(880px 520px at 6% 100%, rgba(96,64,150,.18) 0%, transparent 55%);
}
```

### 3.6 Reusable controls (`components/ui/`)

A small kit every page composes from — keep these, they *are* the interaction
language:

- **`Select`** — a styled listbox popover (not native `<select>`); auto-enables a
  search box when `options.length > 9`; closes on outside-click / Escape.
- **`Segmented`** — pill group for small ordered sets (units, modes, status).
- **`SortHeader`** — table `<th>` with a lucide chevron (up when asc-active, down
  otherwise, dimmed when inactive). Used by every sortable table.
- **`CollapsibleCard`** — `card-surface` whose header folds content away; lets
  dense dashboards (Analyse) be tidied to just the sections you want.
- **`SearchInput`, `Toggle`, `RangeField`, `Field`** — the rest of the form kit.
- **`primitives.tsx`** — `Card`, `Badge`/`DataBadge`, `Crest` (club badge or
  gradient-initial fallback), `Avatar`, `Stat`, `Meter`, `PageHeader`, `Tip`,
  `FormGuide` (W/D/L pips).

Visual rules of thumb: surfaces float (no solid bars — the header is a single
floating glass pill, `sticky top-0`); radii are generous (`rounded-full` pills,
`rounded-2xl` cards); motion is brief and soft (`animate-fade-in`,
`animate-scale-in`, both honouring `prefers-reduced-motion`).

---

## 4. Architecture: two data tiers

The single most important structural idea. There are **two parallel data access
layers**, and which one you use is dictated by whether the component is a Server
or Client Component.

| | `lib/db.ts` (server) | `lib/client.ts` (client) |
|---|---|---|
| Used by | Server Components (`page.tsx` without `"use client"`) | `"use client"` components / interactive pages |
| Source | `import … from "@/data/generated/*.json"` (bundled at build) | `fetch("/data/*.json")` from `public/` |
| Dataset | **full** (every field; multi-MB) | **trimmed** (short keys, only render-needed fields) |
| Cost | zero client bytes — runs at build/SSG time | one network fetch, then cached forever (§7) |
| Examples | home, `liga/[id]`, `lag/[id]`, `spiller/[id]`, `kamp/[id]` | `spillere`, `analyse`, `utforsk`, `sammenlign`, command palette |

**Rule:** *never* import `lib/db.ts` from a client component — it would pull the
multi-MB generated JSON into the browser bundle. Detail pages that can be fully
enumerated are **SSG** (`generateStaticParams` + server `db`); pages that need
client-side filtering/charting over the whole player set fetch the **trimmed**
client JSON via the `useJson` hooks.

`client.ts` shape — a module-level cache + in-flight de-dupe so navigating
between client pages never refetches, and SSR renders a skeleton:

```ts
const cache: Record<string, any> = {};
const inflight: Record<string, Promise<any>> = {};
const V = process.env.NEXT_PUBLIC_DATA_VERSION || "1";
function useJson<T>(url: string): T | null {
  const [data, setData] = useState<T | null>(cache[url] ?? null);
  useEffect(() => {
    if (cache[url]) return setData(cache[url]);
    inflight[url] ??= fetch(`${url}?v=${V}`, { cache: "force-cache" }).then(r => r.json()).then(d => (cache[url] = d));
    let alive = true; inflight[url].then(d => alive && setData(d));
    return () => { alive = false; };
  }, [url]);
  return data;
}
export const usePlayers = () => useJson<CPlayer[]>("/data/players.json");  // + useTeams/useLeagues/useFixtures
```

The client types (`CPlayer`, `CTeam`, …) use **short keys** (`n`, `ts`, `tiv`, `min`)
to shrink the wire payload; the generator writes them, the client hooks consume
them. The full types in `lib/types.ts` are the server-side canonical shapes.

---

## 5. Data model & generation pipeline

Everything is produced at build time by `scripts/generate.mjs` (wired into
`predev` and `build`, so the datasets are always fresh before dev/build). It
emits **both** tiers: full JSON into `src/data/generated/` and trimmed JSON into
`public/data/`.

**Sources** (cached raw under `scripts/cache/`, committed so builds are
reproducible offline):
- **openfootball** (public domain) → real Eliteserien + OBOS results, tables,
  and 2023–2025 history.
- **TheSportsDB** → live 2026 fixtures/standings + club crests/metadata.
- **Wikidata / Wikipedia** → logos and supplementary club facts.

**Real vs modeled (the contract):**
- League **results and tables** for Eliteserien/OBOS are **real**, taken verbatim
  from openfootball.
- The **player layer** (squads, minutes, on-pitch +/−, cards, Team Impact) and
  the **lower/women's divisions** are **modeled** with a *seeded* PRNG
  (`scripts/lib/prng.mjs`, fixed seed `20260601`) so generation is deterministic
  and reproducible.
- Crucially, the modeled player layer for real leagues is **anchored to the real
  scoreline** — real goals are distributed across modeled scorers/minutes — so
  every team result and final table stays exactly real even though the
  player-level detail is synthetic.

**Team Impact** is the headline modeled metric: a standardized on-pitch
goal-difference contribution (an Elo/plus-minus flavour), computed in
`scripts/lib/metrics.mjs` (`computeTeamImpact`) and surfaced with tier labels
(`teamImpactTier`: "Svært verdifull" → "Svak") and tones in `lib/metrics.ts`.
Only "qualified" players (enough minutes; `q === 1`) get a value.

**Canonical types** live in `lib/types.ts` — `League`, `Team`, `Player`,
`Fixture`, `MatchDetail` (events + lineups), `Transfer`, `HistorySeason`,
`Meta`. Each carries a `dataSource: "real" | "modeled"` so any view can render
the honest badge.

For a new season/source: refresh the cache via the `fetch-*.mjs` scripts, bump
`SEASON`/`SEASON_LABEL` in `generate.mjs`, regenerate. `meta.generatedAt` then
changes, which auto-busts the client cache (§7).

---

## 6. Performance playbook

The app is built to be **mostly static and never block on data it doesn't need.**

1. **Static generation everywhere it's possible.** `npm run build` prerenders
   ~650 pages: all leagues, ~165 teams, ~370 players, ~90 matches as static HTML
   (`generateStaticParams` + the server `db`). First Load JS is ~88 kB shared;
   route bundles land ~96–120 kB. Keep it there — watch the build's per-route
   size table after every change.
2. **recharts is lazy, always.** It is *only* imported through
   `charts-lazy.tsx`, which wraps each chart in `next/dynamic(…, { ssr:false,
   loading: <Skeleton/> })`. recharts never enters a first load; a chart pulls
   its own chunk when it mounts. **Never import `components/charts.tsx`
   directly** from a page — go through `charts-lazy.tsx`.
3. **Dependency-free viz for the cheap stuff.** Inline distributions, heatmaps,
   sparklines and diverging bars are pure SVG/CSS in `dataviz.tsx` — no chart lib
   cost for things that don't need one.
4. **Trimmed client payloads + module cache.** Client pages fetch short-keyed
   JSON once; the module-level cache in `client.ts` means switching between
   Analyse/Utforsk/Spillere reuses the same in-memory array (no refetch, no
   re-parse).
5. **Charts don't animate on data they re-render often** (`isAnimationActive={false}`
   on bars/histograms) — avoids re-animation jank when filters change.
6. **Compositor-friendly backdrop** (§3.5) — fixed pseudo-element, not
   `background-attachment: fixed`.
7. **`optimizePackageImports: ["lucide-react", "date-fns"]`** in `next.config`
   so icon/date imports tree-shake to just what's used.
8. **Debounced filters.** Text and range inputs feed `useDebounced(...)` before
   driving the big `useMemo` filter/sort passes, so typing stays smooth over
   thousands of players. Big derived lists are always `useMemo`'d and capped
   (e.g. the Spillere table renders at most 400 rows).

---

## 7. Caching & versioning

`public/data/*.json` is **content-versioned and cached forever**:

```js
// next.config.mjs
async headers() {
  return [{ source: "/data/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
}
// DATA_VERSION is derived from meta.generatedAt and exposed as NEXT_PUBLIC_DATA_VERSION
```

Client fetches hit a **versioned URL** (`/data/players.json?v=<DATA_VERSION>`)
with `cache: "force-cache"`. The bytes at a given versioned URL never change → it
can cache forever; regenerating the data changes `meta.generatedAt` → a new `?v=`
→ a fresh URL that misses the old cache. Repeat visits skip the network entirely.
`DATA_VERSION` is computed once in `next.config.mjs` from `public/data/meta.json`
and injected via `env`. The command palette and every `useJson` use the same `?v=`.

---

## 8. Data honesty (the core promise)

This is non-negotiable and shapes the UI:

- Every league/team/player/fixture carries `dataSource: "real" | "modeled"`.
- The **`<DataBadge source=… />`** primitive renders a green "ekte data" badge or
  an amber "modellert" badge with an explanatory `title`. It appears on cards,
  page headers, and league/match views.
- Pages whose numbers are modeled show a `Badge tone="low"` ("Modellert") in the
  header (Spillere, Utforsk, Analyse, scorer/impact lists).
- The home page and `/om` (about/method) page state plainly which leagues are
  real and that the player layer is modeled-but-anchored.
- **Never** present a modeled value styled identically to a real one. When in
  doubt, label it. (The owner cares about this more than almost anything — see
  the `data-honesty` memory.)

---

## 9. Gender & theme systems

**Gender (men/women)** is a global content switch, not a route:
- Stored in a `kd-gender` cookie (so Server Components read it via `lib/gender.ts`
  `getGender()`) *and* mirrored to `localStorage`.
- `GenderToggle` writes both, dispatches a `kd-gender` CustomEvent (so live
  client components update without a reload), then `router.refresh()` inside a
  `useTransition` to re-render server components for the new gender.
- Client components subscribe via `useGender()` (reads the cookie, listens for
  the event).

**Theme (dark/light)**, default **light** (warm paper):
- A tiny **inline script in `<head>`** (`layout.tsx`) reads `localStorage["kd-theme"]`
  and toggles `.dark` on `<html>` *before paint* — no flash of wrong theme.
- `ThemeToggle` flips the class + persists to `localStorage`. `<html
  suppressHydrationWarning>` because the class is set pre-hydration.
- All colour flows through the HSL variables (§3.2), so toggling one class
  reskins the entire app including charts (which read `hsl(var(--chart-n))`).

---

## 10. Pitfalls & hard-won lessons

- **Server vs client data layer.** Importing `lib/db.ts` (or anything from
  `src/data/generated/`) into a `"use client"` component ships multi-MB JSON to
  the browser. Client components must use `lib/client.ts` hooks. Keep the
  `db.ts` header comment ("only import from Server Components").
- **`background-attachment: fixed` jank.** It repaints the whole page per scroll
  frame. Use a fixed `body::before` layer (§3.5).
- **recharts in the first load.** Importing `components/charts.tsx` directly
  defeats the lazy split. Always go through `charts-lazy.tsx`.
- **Non-unique React keys in viz.** Row labels can legitimately repeat (same club
  short name across divisions); keying a `BoxPlot`/list row by `name` alone
  corrupts reconciliation (stale rows). Key by `${name}-${i}`.
- **No hardcoded base year for age.** Ages must derive from the data/season, not
  a literal like `2024 - birthYear` — the season rolls over and the label silently
  drifts. Read `age` straight off the record (it's computed in the pipeline) or
  off `meta.season`.
- **No raw glyph icons.** `★`, `▲`, `▼` etc. render inconsistently and break the
  "lucide-only, no emoji" rule. Use a lucide component (`Star`, `ChevronUp/Down`)
  so size/weight/colour are controllable.
- **`next lint` / type errors don't block the build** (`eslint.ignoreDuringBuilds`,
  `typescript.ignoreBuildErrors`) — that's deliberate so a deploy never wedges on
  a squiggle, but it means **you** must validate with `npx tsc --noEmit` +
  `npm run build` before claiming done (§14).
- **Locale matters.** Sort Norwegian strings with `localeCompare(a, b, "nb")` and
  format numbers/dates with `Intl.*` + `nb-NO`, or `æ/ø/å` and thousands
  separators come out wrong.
- **Windows line-endings.** Git warns `LF will be replaced by CRLF`; harmless.

---

## 11. Deployment

Connect the GitHub repo to a Vercel project once; thereafter **pushing `main`
auto-deploys** (the owner's default workflow — commit to `main` and push, no PR
ceremony unless asked). `build` runs `generate.mjs` first, so the deployed
datasets are regenerated from the committed source cache on every build. Manual
deploy: `npx vercel --prod`. Custom domains follow the standard Vercel
`A @ 76.76.21.21` + `CNAME www cname.vercel-dns.com` setup.

---

## 12. Owner's working style & preferences

Bake these in so you don't have to ask (mirrors the saved memories):

- **Always `git push` after committing.** Solo, continuously-deployed project on
  `main`; pushing triggers the Vercel deploy.
- **Aesthetic: clean, minimal, modern.** Warm-paper glass + pills, generous
  whitespace and radii, layout that mirrors structure.
- **Icons: lucide only. NO EMOJIS, no raw glyph icons.** Convey state with icon
  swaps + tone colour.
- **Fonts: artsy / minimal / modern** for display type (Syne et al.).
- **Speed matters: "never wait."** Static generation, immutable-cached data,
  lazy charts are features they value.
- **Data honesty is sacred.** Real data only; label anything modeled; never fake
  modeled-as-real.
- **They like data & tasteful stats:** distributions, box plots, scatter labs,
  cross-tabs, Team Impact, age analytics. Lean into it.
- **Iterative & trusting: "try it."** Make a tasteful default and ship rather than
  asking many questions; state any trade-off plainly and offer to revert.
- **Validate before claiming done:** `npx tsc --noEmit` + `npm run build`. Report
  honestly if something failed.

---

## 13. Re-skinning checklist (new league / sport)

1. Replace the `fetch-*.mjs` scripts + `scripts/cache/` to produce your raw
   sources; update `scripts/lib/sources.mjs` (clubs, cities, name pools) and
   `metrics.mjs` (your headline metric) and `generate.mjs` (`SEASON`, league
   defs). Keep the seeded PRNG for any modeled layer; keep the
   real-vs-modeled `dataSource` flag on everything.
2. Keep the **two-tier data architecture** (§4) verbatim: full JSON →
   `src/data/generated/` for server pages, trimmed short-keyed JSON →
   `public/data/` for client hooks.
3. Update `lib/types.ts` + the client `C*` short-key types + the `db.ts`/`client.ts`
   accessors for your entities. Everything downstream (filters, charts, badges)
   is generic.
4. Keep the **design system** (§3) and the **`ui/` control kit** as-is; restyle
   only the tokens if you want a different palette. Keep `DataBadge` and the
   honesty rules.
5. Rename brand/wordmark/metadata/favicon and the nav (`lib/nav.ts`).
6. Wire `next.config.mjs` cache headers for your `public/data` files; confirm
   `DATA_VERSION` derives from your `meta.generatedAt`.
7. `git push` to deploy.

---

## 14. Quick-reference cheatsheet

| Need | Do this |
|------|---------|
| Validate a change | `npx tsc --noEmit` && `npm run build` (the build also regenerates data) |
| Regenerate datasets | `npm run generate` (auto-runs on `predev`/`build`) |
| Refresh from sources | `node scripts/fetch-real.mjs` / `fetch-2026.mjs` / `fetch-logos.mjs`, then `npm run generate` |
| Add data to a **server** page | import accessors from `@/lib/db` (never from a client component) |
| Add data to a **client** page | `usePlayers()/useTeams()/useLeagues()/useFixtures()` from `@/lib/client` |
| Add a chart | import from `@/components/charts-lazy` (never `charts.tsx` directly) |
| Cheap inline viz | `@/components/dataviz` (BoxPlot/Heatmap/MiniHist/DivergeBar/SegBar) |
| New control | reuse `@/components/ui/controls` (Select/Segmented/SortHeader/Collapsible/Toggle) |
| Theme-aware colour | `hsl(var(--token))` / Tailwind semantic utility — never a hex literal |
| Label data provenance | `<DataBadge source={...} />` or `Badge tone="low"` for modeled |
| Cache a static dataset hard | immutable header in `next.config` + `?v=${NEXT_PUBLIC_DATA_VERSION}` |
| Sort/format Norwegian | `localeCompare(a,b,"nb")`; `fmt()/fmtDate()` from `@/lib/format` |
| Deploy | `git push` (auto) or `npx vercel --prod` |
| Screenshot every route | `node scripts/shots.mjs` → `.shots/` |

The framework is league-agnostic; the personality is §3, the speed is §6–§7, the
promise is §8, and the don't-trip-here is §10.
