# Session Resume

## How to resume
Show this file to the AI assistant in your next session. It contains everything from the previous session.

## Working directory
```
G:\delivery soft\
```
All code is here. Git branch: `main` (all changes committed).

## What we built
A template preset system with **8 type-safe Bootstrap templates** for a storefront editor, covering 6 store types:
- `web/src/templates/index.ts` — central registry, all templates imported here
- `web/src/templates/utils.ts` — `renderTemplate(template, state, baseUrl?)` — renders HTML + injects `<base>` tag
- `web/src/pages/admin/StorefrontEditor.tsx` — iframe preview using Blob URL

## The 8 templates
| File | Name | Store Type |
|------|------|-----------|
| `electro-tech.ts` | Electro Tech | tech |
| `tech-gaming.ts` | NEXUS Gaming | gaming |
| `vetement.ts` | Vestiaire | clothes |
| `kaira-clothes.ts` | Kaira | clothes |
| `epicerie-bio.ts` | Organic Bio | grocery |
| `food-broker.ts` | Food Broker | food |
| `eshopper-general.ts` | EShopper | general |
| `ministore-general.ts` | MiniStore | general |

## What was fixed
Templates rendered as "big blocks of writing" because `blob:` iframe URLs block all relative asset paths (`/templates/*/css/style.css` etc.). Fix: `<base href="{origin}/">` injected at render time in `utils.ts:20-23`.

## Template assets (downloaded ZIPs → extracted)
- `web/public/templates/electro/` — CSS, JS, images, libs
- `web/public/templates/eshopper/` — CSS, JS, images, libs
- `web/public/templates/ministore/` — CSS, JS, images
- `web/public/templates/kaira/` — CSS, JS, images
- `web/public/templates/epicerie-bio/` — CSS, JS, images
- `web/public/templates/food-broker/` — CSS, JS, images

## How to run
```powershell
cd G:\delivery soft\web
npm run dev
```
Opens on `http://localhost:3001`. API server on port 4000.

## Git log (recent)
```
a8f625d fix(templates): inject base tag so blob: iframe loads CSS/images correctly
ae25bdd feat(templates): add 4 new Bootstrap templates (Electro, EShopper, MiniStore, Kaira)
52a6e52 fix: assign NEXUS Gaming to gaming store type + filter Thèmes by store type
71f4ba8 feat: split Tech & Gaming into two separate store types
a65bd3d fix: show all 4 templates in Thèmes panel regardless of store type
```

## What remains / future work
1. Templates need **visual refinement** — user said most look "big block of writing, no design, no life". Only Kaira looks ok. The `<base>` fix should make CSS load properly now.
2. Search for better/more stunning Bootstrap 5 templates if needed.
3. `epicerie-bio.ts` is **very large** (all SVG icons inline) — could be optimized.
