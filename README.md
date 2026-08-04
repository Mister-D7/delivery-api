# MISTER-DR Delivery

Application de livraison autonome : **admin SPA + storefront public + pages clientes**.
Développée par **Driss Djellali** — `© 2026 Driss Djellali. All Rights Reserved.`
Git remote : `https://github.com/Mister-D7/delivery-api.git` (branch : `master`)

---

## Architecture

| Couche | Techno | Emplacement |
|--------|--------|-------------|
| **API** | Express (Node) + Supabase (PostgREST) | `server/` |
| **Admin SPA** | React + Vite + TS | `web/src/pages/admin/` → build `web/dist/` |
| **Storefront** | Astro + React islands (runtime, polling 8s) | `web/storefront/src/` → build `web/storefront/dist/` |
| **Pages clientes** | React SPA (shell thème-aware) | `/auth/login`, `/auth/register`, `/track`, `/checkout`, `/profile` |

- Le storefront public et l'admin partagent les **mêmes données runtime** (produits, catégories, textes, couleurs) — aucun build par commande, polling 8s + focus/visibility.
- Le serveur sert le storefront selon le thème actif du blob settings (`delivery_settings` clé `storefront`) : `greens` (actif) ou `pulsar`.
- **Aucun leak admin** côté client (routes `/admin/*` séparées, auth `delivery_token`).

## Fonctionnalités

- **Storefront multi-thèmes** : greens + pulsar (islands React, CSS vars runtime), mode clair/sombre, recherche header connectée à la grille, dropdown « All Categories » live, bannière promos + combos.
- **Édition au clic droit** : mode `?edit=1` → `EditCanvas` permet d'éditer textes/produits/canvas 3D depuis l'aperçu admin (textes persistés dans le blob settings).
- **Suivi de commande** : code de suivi court (`NOM-123456-000001`) partagé client/admin, persistance localStorage, SSE temps réel, notifications (banner + toast + Notification + service worker `web/public/sw.js`).
- **Archive** : commandes livrées/annulées archivées automatiquement après N jours (`archive_after_days`, défaut 30) ; vue `/admin/archive` groupée par date, action « Archiver »/« Restaurer ».
- **Combos/Bundles** : admin (onglet Combos dans l'éditeur) — choisir plusieurs produits (ou en ajouter un manquant avec prix), fixer un prix promo final ; affichage storefront `#combos` sur tout thème.
- **Coupons / Fidélité** : `/admin/coupons` — codes manuels ou générés, % ou montant fixe, minimum de commande, expiration, limites d'usage, assignation à un client « régulier » (avec son historique de commandes) ; saisie du code au checkout avec réduction recalculée (consommation atomique anti double-usage).
- **Comptes clients** : inscription/connexion, profil, commandes.

## Schéma / Migrations

Fichiers SQL **idempotents** à appliquer dans le Supabase SQL Editor :

| Fichier | Objets |
|---------|--------|
| `schema-archive.sql` | colonnes `archived` / `archived_at` sur `delivery_orders` |
| `schema-coupons.sql` | table `delivery_coupons`, colonnes `coupon_id`/`coupon_code`/`discount_amount` sur orders, RPC `consume_coupon_usage` |
| `schema-combos.sql` | table `delivery_combos` |
| `schema-revenue.sql`, `schema-upgrade.sql`, `fix-rls.sql`, etc. | autres migrations / RLS |

## Commandes

```bash
# Serveur API (port 4000)
NODE_ENV=production node server/index.js

# Build admin SPA (web/), puis storefront (web/storefront/)
cd web && node node_modules/vite/bin/vite.js build
cd web/storefront && node ../node_modules/astro/bin/astro.mjs build

# Typecheck SPA (2 erreurs préexistantes admises : NotificationBell.tsx, Revenue.tsx)
cd web && node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

Lanceurs : `start.bat` (production) / `dev.bat` (backend + Vite dev).

## Structure

```
server/               Express API (index.js, routes/, middleware/, lib/)
  routes/orders.js    commandes + archive
  routes/coupons.js   coupons / fidélité
  routes/combos.js    combos
web/src/              React SPA (admin + pages clientes)
web/storefront/src/   pages Astro (greens.astro, pulsar.astro, index.astro) + islands
web/themes/           registry des thèmes admin
schema-*.sql          migrations
```

## Notes

- `node_modules` hoisté dans `web/` ; installer avec `--legacy-peer-deps` (conflit grapesjs préexistant).
- Ne jamais relire les fichiers HTML de design originaux — les thèmes sont portés depuis `themes/<name>/` (source TSX/CSS fournie).
- Voir `SESSION.md` pour l'historique et `AGENTS.md` pour le guide de dev.
