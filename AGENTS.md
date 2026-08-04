# Delivery Soft — Project Guide

## Project Structure
- **`web/`** — React/Vite frontend (SPA). Served as a static build by the server (`server/index.js` serves `../web/dist`, SPA fallback to index.html). App URL: `http://localhost:4000`
- **`server/`** — Express API server (port 4000)
- **`backups/`** — Old template backups (legacy, do not restore)

## Storefront (current — Astro pages + React islands, real-time sync)
The client page is now **Astro** (`web/storefront/`), served by Express on `/`. The React SPA is the admin only. No iframe/preview bridge for the live page anymore — the admin previews via an iframe of the real `/`.

### Architecture
- **Astro page per design**: `web/storefront/src/pages/index.astro` (NEXUS) + `pulsar.astro` (PULSAR, ported from DeepSeek TSX). Design CSS is global (imported or `is:global`); interactive parts are React islands (`client:load`) in `web/storefront/src/components/`.
- **Runtime store**: `web/storefront/src/lib/storefront.ts` — polls every 8s `/api/delivery/catalog` + `/api/delivery/categories/public?storeType=X` + `/api/delivery/storefront/settings/storefront`; applies CSS vars (`--red/--cyan/--violet/--grad/--bg/--surface/--text/--font`) + pinned order; `storeTypeForTheme()` (pulsar→tech, claro→general, nexus-gaming→gaming); refresh is 2-phase (settings first). React hook `useStorefront()`.
- **Data**: `web/storefront/src/lib/data.ts` — `Product`, `StorefrontSettings` (incl. `theme?`), `mapRawProduct(raw, storeType)` (filters store type, maps flat `salePrice`/`promoPrice`).
- **Islands**: NEXUS (`ProductGrid`, `CartButton`→replaced by `HeaderActions`, `CartDrawer`, `ProductModal`, `Brand`, `HeroText`) + Pulsar (`PulsarHero`, `PulsarCategories`, `PulsarProductGrid`, `PulsarSpotlight` + 3D scenes `PulsarHeroScene`, `PulsarSpotlightScene` using `three`) + `HeaderActions` (magnetic cart icon + user globe menu; logout clears `delivery_customer`/`delivery_customer_token` → `/auth/login`). Shared island CSS: `src/styles/islands.css` (drawer/modal/header `hdr-*`/edit-mode `ec-*`, theme-agnostic via CSS vars). `three` is a dependency of `web/` (install with `--legacy-peer-deps`).
- **Edit mode (right-click editing in the admin preview)**: when the storefront URL has `?edit=1`, `EditCanvas` (island on every page) suppresses the browser context menu and shows a custom menu on targets: `[data-edit-text="<settingsKey>"]` (inline text edit → PUT settings blob), `[data-edit-product="<id>"]` (name/price/image modal → POST `/api/delivery/products` with `catalogId`), `[data-edit-3d]` (upload `.glb/.gltf/.fbx/.obj` → POST `/api/delivery/upload/model` → sets blob `model3d`, loaded by `PulsarHeroScene`/`PulsarSpotlightScene` via GLTFLoader). Iframe in `StorefrontEditor.tsx` always uses `?edit=1`. EditCanvas reads `delivery_token` from localStorage (same-origin iframe) for `Authorization: Bearer`.
- **Server**: `server/index.js` — `/` reads the settings blob; if `blob.theme === 'pulsar'` and `dist/pulsar/index.html` exists it serves Pulsar, else `dist/index.html` (NEXUS). `/_assets` → Astro assets, then SPA fallback. Blob in Supabase `delivery_settings` key `storefront` (`GET` public / `PUT` admin).
- **Admin editor**: `web/src/pages/admin/StorefrontEditor.tsx` — preview = iframe of live page (`/`), autosave blob 600ms + Sauvegarder, `buildBlob()` includes `theme: template?.id`. Tools limited to **Thèmes / Produits / Catégories** (pin by drag-drop). Theme list shows a color swatch (bg+accent). Admin theme list comes from `web/src/themes/index.ts` registry = **`[pulsar, greens]`** (claro + nexus-gaming removed — the "easy theme" mindset, no more complex MDX themes).

### Theme source method (NEW — no more reading design HTML files)
- The user supplies a folder with a theme as **TSX** (converted by an external AI, e.g. DeepSeek Vision). Copy it to `G:\delivery soft\themes\<name>\` (CSS + TSX + any readme) — this is the **source of truth**. The user wants a new such folder per theme at the project root. Never re-read the original HTML design files (`G:\DESIGNE DELIVERY FOR CLIENT\...`).

### Adding a new theme (from a TSX folder)
1. Copy the source to `themes/<name>/`; take the CSS → `web/storefront/src/styles/<name>.css` (imported globally in the page; keep the design's CSS vars).
2. `web/storefront/src/pages/<name>.astro` — build the structure from the TSX (header/hero/marquee/sections/footer), replace hardcoded data (products/prices/images) with islands bound to `useStorefront()` + `formatPrice` (DA) + real `imageUrl`. Use `is:global` on any `<style>` block.
3. Small islands in `web/storefront/src/components/` for dynamic bits; port 3D/canvas scenes as islands with **proper cleanup** (cancel RAF, remove listeners, `renderer.dispose()`); size canvases via `canvas.closest('.section')`, NOT `parentElement` (Astro island wrapper is `display:contents`).
4. Add a theme entry in `web/src/themes/` (id, name, storeType, defaults) + register in `themes/index.ts`; add `theme → storeType` mapping in `storefront.ts` `storeTypeForTheme()`; extend `applySettings()` for the design's CSS vars if needed.
5. Wire theme selection: `buildBlob()` already sends `theme: template?.id`; add a branch in `server/index.js` `/` to serve `<name>/index.html` when blob.theme matches (with `fs.existsSync` guard).
6. **Edit-mode parity**: mount `<EditCanvas client:load />` on the page + add `data-edit-text` on texts driven by settings (`storeName`/`bannerText`/`tagline`), `data-edit-product={p.id}` on product cards, `data-edit-3d` on 3D canvases (if any). Also add `data-edit-3d` + `model3d` GLB loading to any 3D scene island (`GLTFLoader` dynamic import, normalize box to fit, guard `led/core/wire` for the procedural path).
7. Rebuild SPA + storefront; verify with Edge headless (`--dump-dom`, check products render + zero admin leak; `?edit=1` dumps the `data-edit-*` attributes, badge appears only after client hydration).

### localStorage keys (admin browser only — the CLIENT page uses the server blob, not localStorage)
- `delivery_store_type`, `delivery_selected_template`, `delivery_storefront_theme_<themeId>`, `delivery_pinned_products`, `delivery_custom_themes`
- `web/src/themes/` (MDX React registry) is now **vestigial** — only feeds the admin theme list; the client page does NOT use it.

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
- **Never re-read design HTML files** (`G:\DESIGNE DELIVERY FOR CLIENT\...`) — NEXUS and PULSAR are ported. New themes come as TSX folders copied to `themes/<name>/` at repo root. Never re-read files already in context.
- **Check `SESSION.md` first** in a new session — it holds the current state and next steps.
- `web` package has a pre-existing peer conflict: `@grapesjs/react@2.0.0` ↔ `grapesjs@^0.23.3` — use `--legacy-peer-deps` when installing.
- Pre-existing TS errors exist in unrelated files (`Storefront.tsx`, `Revenue.tsx`, `StorefrontBuilder.tsx`, `OrderTracking.tsx`, `Customize.tsx`, `NotificationBell.tsx`) — they never block `npm run build` (Vite doesn't typecheck). Only fix errors in files we touch.
- `StorefrontBuilder.tsx` (GrapesJS editor) is separate legacy tooling — do not touch unless asked.

## Commands
- Build (web): `npm run build` (in `G:\delivery soft\web`) → outputs to `dist/`
- Typecheck (web): `npx tsc --noEmit -p tsconfig.json`
- Dev server (Vite): `npm run dev` in `web` — but the app is normally served by `server/index.js` on port 4000 serving `web/dist` (rebuild after web changes).
