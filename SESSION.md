# Session Resume

## How to resume
Show this file to the AI assistant in your next session. It contains everything from the previous session. **Do NOT re-read design HTML files** (`G:\DESIGNE DELIVERY FOR CLIENT\cloud ai design\*.html`) — the NEXUS design is already ported; `pulsar.html` may be read ONCE only if `pulsar.astro` still needs to be created.

## Working directory
```
G:\delivery soft\
```
Git branch: `main`. `web/` = React SPA admin, `web/storefront/` = Astro public page, `server/` = Express (port 4000). node_modules hoisted at repo root — never `npm install` inside `web/storefront`.

## Current architecture (Astro storefront + React admin)
- **Client page** = Astro at `web/storefront/`: `src/pages/index.astro` = NEXUS design (ported). React islands (`client:load`) in `src/components/`: `ProductGrid`, `CartButton`, `CartDrawer`, `ProductModal`, `Brand`, `HeroText`, + Pulsar versions (`PulsarHero`, `PulsarCategories`, `PulsarProductGrid`, `PulsarSpotlight` — written, NOT yet built/verified).
- **Libs** `web/storefront/src/lib/`: `storefront.ts` (runtime store, polls every 8s catalog + categories + settings, applies CSS vars + pinned ordering; `storeTypeForTheme()`: pulsar→tech, claro→general, nexus-gaming→gaming; 2-phase refresh settings-first), `data.ts` (`Product`, `StorefrontSettings` incl. `theme?`, `mapRawProduct(raw, storeType)`), `cart.ts`, `store.ts`, `format.ts` (fr-FR `N DA`).
- **Server** `server/index.js`: `/` → `storefront/dist/index.html`, `/_assets` → Astro assets, then SPA. Supabase settings blob key `storefront` in `delivery_settings` (`GET/PUT /api/delivery/storefront/settings/storefront`).
- **Admin** `web/src/pages/admin/StorefrontEditor.tsx`: preview = iframe of live page, autosave 600ms of blob → server, so admin sees the SAME page as client in real time. Tools now limited to **Thèmes / Produits / Catégories** (Texte/Image/Couleur/Police/Importer.css/Télécharger HTML removed); each theme shows a color swatch (bg+accent).

## KNOWN BUG — CRITICAL (fix first next session)
Astro `<style>` is **scoped** (`data-astro-cid-*` present in dist). The NEXUS design CSS therefore applies only to static markup, NOT to React-island content (product grid, cart drawer, modal). Fix: `is:global` (or `is:inline`) on the `<style>` blocks in `index.astro` + future `pulsar.astro`.

## Current state / what's done
- SPA build green (StorefrontEditor cleaned). Storefront builds green at last full check — BEFORE the Pulsar component edits; must rebuild.
- Real-time sync admin↔client works (products, texts, colors, pinned update live).
- 43 products in catalog. NEXUS = gaming store (STORE_TYPE default 'gaming').

## In progress (next session, in order)
1. Build storefront (`node node_modules/astro/bin/astro.mjs build` in `web/storefront`, or root `npm run build`).
2. Fix CSS scoping with `is:global` on style blocks.
3. Create `pulsar.astro` (port `G:\DESIGNE DELIVERY FOR CLIENT\cloud ai design\pulsar.html` once — design: dark cyan/violet gradient, preloader, hero Three.js canvas, marquee, category grid, spotlight canvas, product grid + pills, features/stats/newsletter/footer; pattern = index.astro).
4. Theme wiring: add `theme: template?.id` to `buildBlob()` in StorefrontEditor; `storeTemplates` = only ported themes (`nexus-gaming`, `pulsar`); Express `/` serves `pulsar.html` when `blob.theme === 'pulsar'` (fs.existsSync guard).
5. Rebuild SPA + storefront; verify via Edge headless DOM (products visible, no admin leak).

## Waiting on the user
User is designing their own better theme solution on their side — DO NOT rebuild the theme system; keep current until they come back.

## Context-burning rules (critical)
- Never re-read big design HTML files or files already read this session; use grep + `read` with `offset`/`limit` on targeted ranges.
- Use the `explore` subagent for searches (compact summaries).
- Keep messages short, no giant summaries. Respond in simple French.

## Commands / gotchas
- Server must run from `G:\delivery soft` (dotenv needs root `.env`): `PORT=4099 node server/index.js`.
- Edge headless: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe --headless=new --window-size=1440,6000 --virtual-time-budget=20000 --dump-dom URL`.
- Admin login via `POST /api/delivery/auth/login` → Bearer token for admin routes.
- Old template system (Bootstrap HTML in `web/public/templates/`, `web/src/templates/`) is DELETED/legacy. `web/src/themes/` MDX registry is vestigial — only used by the admin theme list, NOT by the client page.
