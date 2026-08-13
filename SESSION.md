# SESSION — Storefront Astro + Thème Greens/Pulsar + Feature Batch

## Objectif (archi actuelle)
- Storefront public = **Astro** (`web/storefront/`) avec React islands (`client:load`). `/admin/*` = React SPA (`web/`). Zéro leak admin côté client.
- Admin et client affichent la même page en temps réel (produits, textes, couleurs) : polling 8s + focus/visibility.
- Thème actif en prod = **greens** (blob `storefront` dans Supabase `delivery_settings`, `theme:"greens"`). Page Astro `web/storefront/src/pages/greens.astro` (islands `GreensHeaderSearch`, `OrganicProductGrid`, `GreensFooter`, `PulsarCategories`, `CartDrawer`, `ProductModal`, `EditCanvas`, `PulsarTexts`, `HeaderActions`).
- SPA cliente React : routes `/auth/login`, `/auth/register`, `/track`, `/checkout`, `/profile` (sous `CustomerShell`, thème-aware via `CustomerThemeContext` → `{brand.name}`, vars `--pt-*`). Admin : `/admin/*` (Dashboard, Archive, Customize, Editor, Revenue, Settings).

## Environnement
- Node v24.17.0 (chemin exe `E:\New Folder\node.exe`), `node_modules` hoisté : **`G:\delivery soft\web\node_modules`**.
- Builds : SPA `node node_modules/vite/bin/vite.js build` (workdir `web`) ; storefront `node "G:\delivery soft\web\node_modules\astro\bin\astro.mjs" build` (workdir `web/storefront`) ; typecheck `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` (workdir `web`) — seules 2 erreurs préexistantes admises (`NotificationBell.tsx:325`, `Revenue.tsx:101`).
- Serveur prod : `NODE_ENV=production node server/index.js` depuis `G:\delivery soft` (PORT 4000). Redémarrer via Stop-Process + Start-Process (exe `E:\New Folder\node.exe`, workdir `G:\delivery soft`, logs `server.out.log`/`server.err.log`). Vérif : `curl.exe http://localhost:4000/api/delivery/health`.
- Vérif storefront : `"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --dump-dom http://localhost:4000/`.

## Données / API
- `/api/delivery/catalog`, `/api/delivery/categories/public?storeType=X`, `GET/PUT /api/delivery/storefront/settings/storefront` (blob public GET / PUT admin), `GET/PUT /api/delivery/storefront/settings/:key` (settings clé/valeur), `/api/delivery/orders` (+ `?archived=`, `:id/archive`, `:id/unarchive`), `/api/delivery/orders/:token`, SSE `/api/delivery/orders/token/:token/events`.
- Auth admin : Google + login email/mot de passe (`delivery_token`). Client : `delivery_customer`/`delivery_customer_token`.

## Feature batch (cette session — FAIT, serveur redémarré PID 5080)
1. **Storefront greens — recherche + catégories** : header form remplacé par island `GreensHeaderSearch` (dispatche `og:search` `{query, category}` sur `window`), `OrganicProductGrid` écoute et filtre (typing filtre réellement, submit scroll vers `#lineup`). Dropdown "All Categories" alimenté en live par `/api/delivery/categories/public` (store type via `storeTypeForTheme`). Bouton **Accueil supprimé** (logo = home) desktop + mobile.
2. **Dark mode + footer greens** : `og-brand` (store name) contrasté light/dark ; `[data-theme="dark"] .og-header/.og-footer img[alt="Organic"] { filter: brightness(0) invert(1); }` ; `GreensFooter` island → `© {année courante} {storeName}. All rights reserved.` (plus de 2024 en dur) + phone/email depuis `settings.texts`.
3. **Edit mode** : `EditCanvas` déjà monté ; ajout `data-edit-text` (`storeName`, `copyright`, footer contact) sur greens.
4. **Tracking SPA** : `OrderTracking.tsx` persiste `delivery_track_token` pour guest comme connecté, restaure au mount (ref `didMount` pour éviter réouverture auto depuis `/track/:token`), purge sur 404 ou bouton ✕. Carte "Code de suivi" (`secureToken`, bouton Copier) — le token `secure_token` (`NAME-<last6>-<counter>`) est déjà généré côté serveur, partagé admin/client. `mapOrder` expose déjà `secureToken`.
5. **Notifications SPA** : sur SSE `status_changed` → banner in-app dismissible + `react-hot-toast` + `new Notification` ; `public/sw.js` (nouveau, enregistré via `main.tsx`) reçoit `postMessage` et fait `showNotification` (marche sur mobile tant que l'onglet est ouvert — pas de push background, pas de VAPID/FCM). i18n keys `order-tracking.json`.
6. **Archive admin** : `server/lib/archive.js` (nouveau : `getArchiveDays`, `runAutoArchive`, `startArchiveScheduler`) ; `GET /orders` filtre `?archived=true|all|absent→active` (+ fallback si colonne absente) ; `POST /orders/:id/archive|unarchive` ; `Dashboard.tsx` action "Archiver" ; **`ArchiveView.tsx`** (nouveau, route `/admin/archive` + nav "Archives", groupement par date fr-FR, réglage `archive_after_days` défaut 30 via settings) ; `delivery_orders` + colonnes `archived`/`archived_at` dans `setup.js` (frais install) ; auto-archive toutes les 6h + throttlé 1/h depuis GET /orders.
7. **Builds** : storefront (21 pages) + SPA verts ; dist vérifié (sw.js, ArchiveView chunk, greens). Typecheck = seulement les 2 erreurs préexistantes.

## Feature batch 2 (cette session — FAIT, serveur redémarré PID 3960)
8. **Branding greens + SPA shell** : copyright fixe `© {année} Driss Djellali. All Rights Reserved.` (non éditable, storefront + CustomerShell) ; crédit footer `Designed by Driss-Djellali` (remplace Organic/PULSAR/DjDr) ; colonne **Contact** admin-fillable au clic droit (`texts.contactPhone/contactEmail/socialFacebook/socialInstagram`, `data-edit-text`), reflétée dans CustomerShell ; nav footer en français (À propos/Conditions/Nos Journaux/Liens rapides/Offres/Boutique/Magasins + colonne S'abonner) ; gibberish supprimé (`Dignissim...` → tagline FR, lorem ipsum → textes FR) ; **section blog supprimée** ; type `StorefrontTexts` ajouté dans `data.ts` (`texts?:`).
9. **Leak PULSAR supprimé** : `TermsGate.astro` (monté sur greens) affichait la carte `▲ PULSAR / Designed by DjDr` → maintenant neutre, lit le blob settings (`storeName`, `texts.contactEmail/contactPhone`, fallback djellalidris02@gmail.com / @Phantom_DR), crédit `Designed by Driss-Djellali`. Aucun PULSAR/DjDr dans le dist greens servi.
10. **Coupons/Fidélité** (theme-agnostic, IMPORTANT) : `delivery_coupons` (percent/fixed, min_order, expiry, max_uses, used_count, customer_id) + colonnes `coupon_id/coupon_code/discount_amount` sur `delivery_orders` + RPC atomique `consume_coupon_usage` (anti double-usage). `server/routes/coupons.js` (CRUD admin, `/generate`, `/validate`, `/customers` avec orderCount) monté sur `/api/delivery/coupons`. `orders.js` POST applique le coupon (validate → discount → stocke → consume). SPA : `admin/Coupons.tsx` (liste, création manuelle/générée/assignée à un client « régulier », toggle, delete), route `/admin/coupons` + nav, `Checkout.tsx` (input code + Appliquer → `/validate` → ligne Réduction + total recalculé, `couponCode` dans le payload, erreurs FR par reason). i18n fr/en/ar (common.nav.coupons, checkout.coupon.*, coupons.form.orders).
11. **Combos/Bundles** (theme-agnostic) : `delivery_combos` (name, description, price=prix promo, image_url, is_active, products JSONB [{productId,qty}]). `server/routes/combos.js` (CRUD admin + `GET /active` public enrichi des produits) monté sur `/api/delivery/combos`. Admin : onglet **Combos** dans `StorefrontEditor.tsx` (choix multi-produits + ajout d'un produit manquant avec prix + prix promo final + économies). Storefront : island `CombosSection.tsx` (styles `combo-*` dans islands.css, addItem au prix du combo) monté sur greens à `#combos` ; bannière « Combo offers » → `/#combos`, « Items on SALE » → `/#lineup` (produits en promo affichés avec badge).
12. **Builds** : storefront 21 pages + SPA verts ; typecheck = 2 erreurs préexistantes seules ; serveur restarté PID 3960 (routes coupons+combos actives).

## À FAIRE / ACTION REQUISE
- ✅ `schema-archive.sql` appliqué. Serveur PID 3960. `archive_after_days` absent en base → défaut 30 (PUT via la vue Archive le crée).
- **⚠ ACTION UTILISATEUR : appliquer dans le Supabase SQL Editor (dans cet ordre) : `G:\delivery soft\schema-coupons.sql` PUIS `G:\delivery soft\schema-combos.sql`** (idempotents, additifs). Sans eux : `GET /api/delivery/coupons`/`combos` échouent (table manquante) et `POST /orders` avec coupon échoue. Checkout/toggle coupons planteront tant que `delivery_coupons` n'existe pas.
- ✅ **APPLIQUÉ** par l'utilisateur. NB pièges corrigés au passage : `customer_id` du coupon = **TEXT** (la vraie table `delivery_customers.id` est TEXT, pas UUID → la FK refusait) ; garde `pg_proc` pour `update_updated_at()` ; délimiteurs `$do$`/`$func$` (pas de `$$` imbriqué). Vérif live : `/coupons/validate` → NOT_FOUND (OK), `/combos/active` → `{"combos":[]}` (OK), `/coupons` admin → 401.
- Commit non fait (tout le lot pas commité).

## À FAIRE / ACTION REQUISE
- ✅ `schema-archive.sql` **appliqué** par l'utilisateur dans le Supabase SQL Editor (colonne `archived`/`archived_at` présente). Serveur redémarré (PID 12356), boot auto-archive sans erreur. `GET /api/delivery/storefront/settings/archive_after_days` → `null` (pas encore créée : `getArchiveDays()` retombe sur 30 ; la vue Archive permet de la créer via PUT).
- Commit non fait (workstreams entiers pas commités).
- PDF receipt footer affiche encore "MISTER-DR" (partagé admin) — décision utilisateur pendante sur le suivi du thème.
- Options : push background réel (VAPID/service worker persistant) si demandé ; vérifier `PulsarCategories` présent sur greens (catégories PLAY/LUMEN = données demo).

## Refactor / nettoyage (2026-08-10) — FAIT, aucune modification git ni README
- **Supprimé (code mort confirmé, zéro import)** : `web/src/themes/ui/*` (13 fichiers), `themes/ThemeRoot.tsx`, `themes/gaming/page.tsx`, `themes/pulsar/page.mdx` + `skin.css`, `web/src/mdx.d.ts`, `components/theme/GlowWrapper.tsx` + `AdminBgVideo.tsx`, `hooks/useAnimationGate.ts`, `context/ThemeContext.tsx`, `context/AdminBackgroundContext.tsx`, `pages/admin/EditorSidebarLeft.tsx` + `EditorSidebarRight.tsx` (reliques du StorefrontBuilder supprimé).
- **`web/src/themes/index.ts` réécrit en registre metadata-only** (id/name/storeType/defaults, customs) — plus de `Component`, `preview`, `skinCss`, `ThemeData`. `themes/{pulsar,greens,gaming}/index.ts` = metadata seuls. Le listing thèmes admin utilise `defaults.bg/accent` — intact.
- **`web/public/templates/` supprimé** (designs legacy ashion/electro/foodmart + previews SVG, non servis).
- **`Nouveau Document texte.txt` supprimé** (notes obsolètes sur le Builder).
- **`setup.js` déplacé → `server/setup.js`** (ENV_PATH corrigé vers `..`). `package.json` `npm run setup` et `start.bat` mis à jour.
- **Tous les `*.sql` racine → `sql/`** (schema-archive, cloud, combos, coupons, employees, fix-storage, fix, nav, revenue, upgrade, fix-rls). Chemins des docs obsolètes = `sql/<nom>.sql`.
- **`.gitignore`** : ajout `web/storefront/dist/` (le `web/dist/` y était déjà).
- **⚠ git en suspens (l'utilisateur veut gérer git lui-même)** : `web/dist` + `web/storefront/dist` sont ENCORE trackés (108 fichiers → churn à chaque build). Pour les untracker :
  `git rm -r --cached web/dist web/storefront/dist` (les fichiers restent sur disque ; `.gitignore` couvre déjà les deux).
- Note : `backups/` gardé (gitignored, legacy), `themes/pulsar` racine gardé (source-of-truth).

## Fichiers clés
- `web/storefront/src/pages/greens.astro` + `components/GreensHeaderSearch.tsx` (nouveau), `GreensFooter.tsx` (nouveau), `OrganicProductGrid.tsx` (écoute `og:search`), `styles/greens.css` (dark-mode logo, `og-brand`).
- `web/src/pages/OrderTracking.tsx`, `web/src/hooks/useOrderSSE.ts`, `web/public/sw.js` (nouveau), `web/src/main.tsx` (enregistrement SW), `web/src/context/CustomerThemeContext.tsx`, `web/src/components/CustomerShell.tsx`.
- `server/lib/archive.js` (nouveau), `server/routes/orders.js` (filtre archived + archive/unarchive), `server/index.js` (scheduler), `server/routes/setup.js` (colonnes + setting `archive_after_days`).
- `web/src/pages/admin/ArchiveView.tsx` (nouveau), `Dashboard.tsx`, `App.tsx` (route `/admin/archive`), `components/layout/AdminLayout.tsx` (nav Archives), `i18n/locales/*/common.json` (`nav.archive`), `i18n/locales/*/order-tracking.json`.
- `G:\delivery soft\schema-archive.sql` (à appliquer), `G:\delivery soft\.env` (PORT=4000, SUPABASE_*).
