# SESSION — Storefront Astro + Thème Pulsar (porté via DeepSeek TSX)

## Objectif (archi actuelle)
- Storefront public = **Astro** (`web/storefront/`) avec React islands (`client:load`/`client:visible`). `/admin/*` = React SPA (`web/`). Zéro leak admin côté client.
- Admin et client affichent **la même page en temps réel** (produits, textes, couleurs, produits épinglés) : polling 8s + focus/visibility. Données **runtime** (pas build-time).
- **Plus AUCUN travail sur les HTML de design** (`G:\DESIGNE DELIVERY FOR CLIENT\...`). Nouvelle méthode : l'utilisateur fournit un dossier avec thème en **TSX** → copié dans `G:\delivery soft\themes\<name>\` (source de vérité) → porté en page `.astro` + islands.

## Règles anti-burn (EXIGENCE de l'utilisateur — à respecter strictement)
- Ne jamais relire les HTML de design ni les gros fichiers déjà en contexte.
- Utiliser `grep` ciblé / `read` avec offset/limit / agent `explore`. Réponses courtes.
- L'utilisateur prévient « je suis presque hors contexte » → tout sauvegarder immédiatement (SESSION.md + AGENTS.md + commit).
- Parler français, ton « habibi ».

## Environnement
- Node v24.17.0, npm 11.17.0, Astro 7.1.6, @astrojs/react 6.0.2, React 18.3.1.
- `node_modules` hoisté : **`G:\delivery soft\web\node_modules`** (PAS à la racine ni dans storefront).
- Builds : `node "G:\delivery soft\web\node_modules\astro\bin\astro.mjs" build` (workdir `web/storefront`) ; SPA : `node node_modules/vite/bin/vite.js build` (workdir `web`).
- Serveur : lancer de `G:\delivery soft` (`PORT=4099 node server/index.js`) — sinon `supabaseUrl is required.`.
- Vérif : `"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --dump-dom http://localhost:4099/` (le DOM dump est fiable ; `--virtual-time-budget` peut donner DOM vide, ne pas en dépendre).
- `three` ajouté à `web/` via `npm i three --legacy-peer-deps` (conflit grapesjs/@grapesjs/react préexistant → toujours `--legacy-peer-deps`).

## Données / API
- `/api/delivery/catalog` (flat : `salePrice`, `promoPrice`, `imageUrl`, `storeType`, `category.name`).
- `/api/delivery/categories/public?storeType=X`.
- Blob settings : `GET/PUT /api/delivery/storefront/settings/storefront` (Supabase `delivery_settings` clé `storefront`). Contient `theme`, `pinned`, couleurs, fonts, textes. Le GET est **public** (pas d'auth), le PUT est admin.
- Auth admin : Google + login email/mot de passe (users table). Il existe un « mode invité » (l'utilisateur l'a mentionné).
- Le blob en prod a déjà `theme: "pulsar"`.

## Ce qui est FAIT (cette session = port Pulsar complet)
1. **Nouvelle méthode thème validée** : dossier source → `themes/<name>/` à la racine. Pulsar copié → `G:\delivery soft\themes\pulsar\` (deepseek_css + deepseek_tsx + txt résumés).
2. **`three` installé** (hoisté web/).
3. **Scènes 3D** : `web/storefront/src/components/PulsarHeroScene.tsx` (canvas `#heroCanvas`, `class="p3d-hero-canvas"`) + `PulsarSpotlightScene.tsx` (canvas `#spotlightCanvas`). Bugs DeepSeek corrigés : RAF annulé, listeners `pointerdown/move/up` + `resize` retirés, `renderer.dispose()`.
   - IMPORTANT : dans `PulsarHeroScene`, le conteneur = `canvas.closest('.hero')` (PAS parentElement — l'island wrapper a `display:contents`).
4. **4 islands Pulsar** (`PulsarHero`, `PulsarCategories`, `PulsarProductGrid`, `PulsarSpotlight`) — alignés sur les classes du CSS DeepSeek. `PulsarSpotlight` ne rend plus de canvas (le scene le fournit) ; il rend `<div>` texte + bouton, se place à côté de `<PulsarSpotlightScene/>`.
5. **CSS** : `themes/pulsar/deepseek_css_*.css` copié → `web/storefront/src/styles/pulsar.css` (importé global dans pulsar.astro ; styles canvas `#heroCanvas`/`#spotlightCanvas` ajoutés en fin de fichier + `.iso-close`).
6. **`web/storefront/src/pages/pulsar.astro`** : structure complète (header/marquee/shop/featured/lineup/features/stats/newsletter/footer), islands `client:load`, script burger. **2 pages Astro** : `/` (nexus) + `/pulsar/`.
7. **Câblage thème** :
   - `StorefrontEditor.tsx` : `buildBlob()` inclut `theme: template?.id` (deps `[settings, pinned, template]`).
   - `server/index.js` : import `fs` ajouté ; route `/` lit le blob, si `blob?.theme === 'pulsar'` et `dist/pulsar/index.html` existe → sert pulsar, sinon `dist/index.html` (nexus).
   - `web/src/themes/index.ts` : `claro` retiré du registry → liste admin = `[nexusGaming, pulsar]` seulement.
8. **Vérifié Edge headless** (serveur 4099) : `/` sert PULSAR, 8 produits runtime en DA, vraies images `/uploads/*.jpg`, catégories PLAY/LUMEN, canvas 3D hero+spotlight, cart drawer, zéro leak admin. Builds SPA + storefront verts.

## À FAIRE / PROCHAINES ÉTAPES
- **Commit** : 38 fichiers modifiés/nouveaux (theme wiring, pulsar page, three, dist) — PAS ENCORE COMMITÉ.
- Si l'utilisateur fournit d'autres thèmes TSX : répéter la pipeline (copier dans `themes/<name>/` → CSS importé global dans une page `.astro` → islands branchés sur `useStorefront()` → ajouter id au registry admin + mapping `storeTypeForTheme` si besoin → branch Express).
- Notes : `three` bundle ~724 KB (chunk séparé, chargé à la demande — OK). Le `<style>` des pages Astro DOIT avoir `is:global` sinon le CSS design ne s'applique qu'au markup statique (bug NEXUS fixé ceci, vérifier pour toute nouvelle page).
- `@astrojs/check` non installé → pas de `astro check` ; le build suffit.

## Fichiers clés
- `G:\delivery soft\SESSION.md`, `AGENTS.md` : état + guide (à jour).
- `G:\delivery soft\themes\pulsar\` : source officielle du thème Pulsar (TSX + CSS).
- `web/storefront/src/pages/{index.astro, pulsar.astro}` : pages thèmes.
- `web/storefront/src/components/` : islands (NEXUS + Pulsar + scènes 3D).
- `web/storefront/src/styles/` : `islands.css` (importé par CartDrawer/ProductModal), `pulsar.css`.
- `web/storefront/src/lib/` : `storefront.ts` (useStorefront, applySettings, storeTypeForTheme : pulsar→tech, claro→general, nexus-gaming→gaming), `data.ts` (`Product`, `StorefrontSettings` incl. `theme?`, `mapRawProduct`), `cart.ts`, `store.ts`, `format.ts`.
- `server/index.js` : route `/` thématisée.
- `web/src/pages/admin/StorefrontEditor.tsx` : éditeur (Thèmes/Produits/Catégories) + blob.
- `web/src/themes/index.ts` : registry admin (nexus-gaming, pulsar) + helpers.
