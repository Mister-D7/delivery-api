# Delivery Soft — Project Guide

## Project Structure
- **`web/`** — React/Vite frontend (SPA). Served as a static build by the server (`server/index.js` serves `../web/dist`, SPA fallback to index.html). App URL: `http://localhost:4000`
- **`server/`** — Express API server (port 4000)
- **`backups/`** — Old template backups (legacy, do not restore)

## Storefront (current — Astro pages + React islands, real-time sync)
The client page is now **Astro** (`web/storefront/`), served by Express on `/`. The React SPA is the admin only. No iframe/preview bridge for the live page anymore — the admin previews via an iframe of the real `/`.

### Architecture
- **Astro page per design**: `web/storefront/src/pages/index.astro` (NEXUS, ported). Design HTML+CSS lives in `.astro`; interactive parts are React islands (`client:load`) in `web/storefront/src/components/`.
- **Runtime store**: `web/storefront/src/lib/storefront.ts` — polls every 8s `/api/delivery/catalog` + `/api/delivery/categories/public?storeType=X` + `/api/delivery/storefront/settings/storefront`; applies CSS vars (`--red/--bg/--surface/--text/--font`) + pinned order; `storeTypeForTheme()` (pulsar→tech, claro→general, nexus-gaming→gaming); refresh is 2-phase (settings first). React hook `useStorefront()`.
- **Data**: `web/storefront/src/lib/data.ts` — `Product`, `StorefrontSettings` (incl. `theme?`), `mapRawProduct(raw, storeType)` (filters store type, maps flat `salePrice`/`promoPrice`).
- **Islands**: `ProductGrid`, `CartButton`, `CartDrawer`, `ProductModal`, `Brand`, `HeroText` (NEXUS) + `PulsarHero`, `PulsarCategories`, `PulsarProductGrid`, `PulsarSpotlight` (Pulsar, written but unverified). Shared island CSS: `src/styles/islands.css` (drawer/modal, theme-agnostic via CSS vars).
- **Server**: `server/index.js` — `/` → `storefront/dist/index.html`, `/_assets` → Astro assets, then SPA fallback. Settings blob in Supabase `delivery_settings` key `storefront` (`GET/PUT /api/delivery/storefront/settings/storefront`).
- **Admin editor**: `web/src/pages/admin/StorefrontEditor.tsx` — preview = iframe of live page (`/`), autosave blob 600ms + Sauvegarder. Tools limited to **Thèmes / Produits / Catégories** (pin by drag-drop). Theme list shows a color swatch (bg+accent).

### KNOWN BUG — fix first
Astro `<style>` is **scoped** (`data-astro-cid-*`). Design CSS only reaches static markup, NOT React islands. Use `is:global` on `<style>` in `index.astro` and `pulsar.astro`.

### localStorage keys (admin browser only — the CLIENT page uses the server blob, not localStorage)
- `delivery_store_type`, `delivery_selected_template`, `delivery_storefront_theme_<themeId>`, `delivery_pinned_products`, `delivery_custom_themes`
- `web/src/themes/` (MDX React registry: `nexus-gaming`, `pulsar`, `claro`) is now **vestigial** — only feeds the admin theme list; the client page does NOT use it.

### Adding a new design (porting an HTML design)
1. `web/storefront/src/pages/<name>.astro` — copy the design's HTML+CSS verbatim (CSS global via `is:global`), replace interactive parts with React islands.
2. Small islands in `web/storefront/src/components/` for dynamic bits (products, cart, brand, hero text).
3. Add `theme` → store type mapping in `storefront.ts` `storeTypeForTheme()`; extend `applySettings()` for the design's CSS vars if needed.
4. Wire theme selection: add `theme: template?.id` to the admin blob; Express `/` serves `<name>.html` when blob.theme matches.
5. Build storefront, build SPA, verify via Edge headless DOM.

## Open Design (OD) integration — design engine for themes
OD 0.16.1 installed at `F:\Open Design` (Electron). The daemon runs INSIDE the desktop app (`Open Design.exe`) and is **auth-gated** via a named pipe — there is no fixed port anymore.
- **Start the daemon**: open the app `F:\Open Design\Open Design.exe`. It listens on an ephemeral port; `/api/mcp/install-info` on that port returns the current URL + the exact recommended MCP wiring.
- Daemon CLI entry: `F:\Open Design\resources\app\prebundled\daemon\daemon-cli.mjs`. Do NOT run it with `E:\New Folder\node.exe` (Node 24) — `better-sqlite3` needs the Electron ABI; launching the CLI via `Open Design.exe` with `ELECTRON_RUN_AS_NODE=1` works.
- **MCP wiring** (global config `C:\Users\KeepCool\.config\opencode\opencode.jsonc`, already set): `command: ["F:\\Open Design\\Open Design.exe", "...\\daemon-cli.mjs", "mcp"]` + `env: { OD_DATA_DIR: "...\\release-stable-win\\data", OD_SIDECAR_IPC_PATH: "\\\\.\\pipe\\open-design-release-stable-win-daemon", ELECTRON_RUN_AS_NODE: "1" }`. The pipe name is stable per namespace. opencode must be restarted after config changes (config loads once at startup).
- Daemon user data: `C:\Users\KeepCool\AppData\Roaming\Open Design\namespaces\release-stable-win\` (logs: `logs\daemon\latest.log`)
- If `open_design_*` MCP calls say "cannot reach the Open Design daemon": the app is closed → ask the user to open `Open Design.exe`. If they fail despite the app being open, re-read `/api/mcp/install-info` from the app's current port (find the daemon PID in `logs\daemon\latest.log` state JSON `url`).

### Theme pipeline (generate with OD → port into our theme system)
1. Confirm OD daemon is up (`od` MCP tools respond; else ask user to open the OD app).
2. `list_skills` / `list_plugins` / `list_agents` → pick a skill/design system + the agent OD will run.
3. `create_project(name)` → `start_run(prompt, skill?, agent?)` → `get_run(runId)` polling every 30–60s.
4. OD runs take **5–30 minutes** — DO NOT cancel and hand-write as a "faster" workaround; keep polling and tell the user "still working".
5. On success `get_artifact(project)` pulls the full bundle (HTML/CSS/JSX). 
6. Port the design: create `web/storefront/src/pages/<name>.astro` (design HTML+CSS, `is:global` style) + islands in `web/storefront/src/components/`, add the theme mapping in `storefront.ts` `storeTypeForTheme()`, register in the admin theme list.
7. Verify in `/admin/editor/full` (switches theme, keeps per-theme settings) + `Télécharger HTML`.

## Working conventions (this project)
- The user is a French/Darija speaker — respond in simple French-friendly terms, step by step, confirm before big actions.
- Work happens in `G:\delivery soft\web` (and `server`). The opencode session cwd may be elsewhere; always use absolute paths.
- **Never read huge generated files** (theme HTML, bundles) unless needed — prefer grep/glob and targeted reads.
- **Never re-read design HTML files** (`G:\DESIGNE DELIVERY FOR CLIENT\cloud ai design\*.html`) — NEXUS is ported; `pulsar.html` only if `pulsar.astro` needs creating. Never re-read files already in context.
- **Check `SESSION.md` first** in a new session — it holds the current state and next steps.
- `web` package has a pre-existing peer conflict: `@grapesjs/react@2.0.0` ↔ `grapesjs@^0.23.3` — use `--legacy-peer-deps` when installing.
- Pre-existing TS errors exist in unrelated files (`Storefront.tsx`, `Revenue.tsx`, `StorefrontBuilder.tsx`, `OrderTracking.tsx`, `Customize.tsx`, `NotificationBell.tsx`) — they never block `npm run build` (Vite doesn't typecheck). Only fix errors in files we touch.
- `StorefrontBuilder.tsx` (GrapesJS editor) is separate legacy tooling — do not touch unless asked.

## Commands
- Build (web): `npm run build` (in `G:\delivery soft\web`) → outputs to `dist/`
- Typecheck (web): `npx tsc --noEmit -p tsconfig.json`
- Dev server (Vite): `npm run dev` in `web` — but the app is normally served by `server/index.js` on port 4000 serving `web/dist` (rebuild after web changes).
