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
| File | Name | Store Type | Source |
|------|------|-----------|--------|
| `electro-tech.ts` | Electro Tech | tech | HTML Codex (CC BY 4.0) |
| `tech-gaming.ts` | NEXUS Gaming | gaming | Start Bootstrap (MIT) |
| `vetement.ts` | Vestiaire | clothes | TemplateMo (free) |
| `kaira-clothes.ts` | Kaira | clothes | ThemeWagon (MIT) |
| `epicerie-bio.ts` | Organic Bio | grocery | TemplateMo (free) |
| `foodmart.ts` | FoodMart | food | ThemeWagon (MIT) |
| `ashion.ts` | Ashion | general | Colorlib (CC BY 3.0) |
| `coloshop.ts` | ColoShop | general | Colorlib (free) |

## What was fixed
- `<base href="{origin}/">` injected at render time in `utils.ts:20-23` so `blob:` iframes load relative asset paths

## Template assets
- `web/public/templates/electro/` — CSS, JS, images, libs
- `web/public/templates/kaira/` — CSS, JS, images
- `web/public/templates/epicerie-bio/` — CSS, JS, images
- `web/public/templates/foodmart/` — CSS, JS, images (replaces old food-broker)
- `web/public/templates/ashion/` — CSS, JS, images, fonts (replaces old MiniStore)
- `web/public/templates/coloshop/` — CSS, JS, plugins, images (replaces old EShopper)

## Retired templates (replaced)
- `food-broker.ts` → FoodMart (modern Bootstrap 5 food/grocery)
- `ministore-general.ts` → Ashion (Colorlib fashion/general)
- `eshopper-general.ts` → ColoShop (Colorlib general eCommerce)

## How to run
```powershell
cd G:\delivery soft\web
npm run dev
```
Opens on `http://localhost:3001`. API server on port 4000.

## Git log (recent)
```
d873e9b docs: add SESSION.md for session resume
a8f625d fix(templates): inject base tag so blob: iframe loads CSS/images correctly
ae25bdd feat(templates): add 4 new Bootstrap templates (Electro, EShopper, MiniStore, Kaira)
52a6e52 fix: assign NEXUS Gaming to gaming store type + filter Thèmes by store type
71f4ba8 feat: split Tech & Gaming into two separate store types
a65bd3d fix: show all 4 templates in Thèmes panel regardless of store type
```

## What remains / future work
1. **Verify new templates** — run `npm run dev` in `web/`, check all 8 templates render properly with CSS/images
2. **Visual refinement** — even new templates may need CSS tweaks to look perfect in the iframe
3. **Optimize** `epicerie-bio.ts` — huge inline SVG icons could be moved to external files
