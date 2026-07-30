# MISTER-DR Delivery

Standalone admin + customer delivery app.  
Git remote: `https://github.com/Mister-D7/delivery-api.git` (branch: `master`)

---

## Project Ecosystem

| Project | Path | Description |
|---------|------|-------------|
| **Delivery** (this repo) | `G:\delivery soft` | Delivery admin + client app (Express + React/Vite) |
| **ERP** | `G:\drissoftware` | Main ERP — modules, apps, dashboards |
| ERP apps | `G:\drissoftware\apps` | Sub-modules from the original monolith |
| ERP → Delivery API | `G:\drissoftware\delivery-api` | Legacy delivery API within ERP |
| ERP → Delivery App | `G:\drissoftware\delivery-app` | Legacy delivery app within ERP |
| **AI Surveillance** | `G:\drissoftware\ALONE SURVEILLANCE` | AI surveillance module |

---

## Repo Structure

```
G:\delivery soft/
├── server/              # Express API (index.js, routes/, middleware/, lib/)
├── web/                 # React/Vite frontend (src/, public/, dist/)
├── uploads/             # File uploads
├── backups/             # DB backups
├── schema-*.sql         # Database migration scripts
├── setup.js             # Setup script
├── dev.bat / start.bat  # Dev/start launchers
├── opencode.json        # opencode AI assistant config
└── README.md
```

---

## Session History (what we've done)

### Template Preset System (commits `4c2c265` → `52a6e52`)
- 4 template presets with HTML/CSS injection into an iframe editor
- Templates: NEXUS Gaming (`gaming`), Vestiaire (`clothes`), Organic Bio (`grocery`), Food Broker (`food`)
- Circular dependency fixed — templates `export default`, `index.ts` registers centrally
- Store types split: `tech | gaming | clothes | grocery | food | general`
- Settings page shows 6 store-type cards in 3x2 grid
- Editor Thèmes panel filters templates by selected store type

### Template Downloads
- **shop-homepage** (Start Bootstrap, MIT, Bootstrap 5) → extracted OK
- **zay-shop** (TemplateMo, free, Bootstrap 5) → extracted OK
- **Electro** (HTML Codex, CC BY 4.0, Bootstrap 5, tech) → corrupted zip, re-downloaded from GitHub mirror (`samjoshuaben-alt/Electronics`)
- **EShopper** (HTML Codex, CC BY 4.0, Bootstrap 4) → corrupted zip, re-downloaded from GitHub mirror (`rskworld/EShopper-Bootstrap-Shop-Template`)

Extracted zips are at `C:\Users\KeepCool\AppData\Local\Temp\opencode\templates-dl/`.

---

## Next Steps

1. **Integrate Electro template** — copy assets from the GitHub mirror into `web/public/templates/electro/`, create `web/src/templates/electro.ts` for `storeType: 'tech'`
2. **Integrate EShopper template** — same process for `storeType: 'general'`
3. **Register both** in `web/src/templates/index.ts`
4. Verify with `npm run dev` in `web/`
