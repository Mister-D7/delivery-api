import { useCallback, useRef, useState, useEffect } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import GjsEditor from '@grapesjs/react';
import { Save, Minimize2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import 'grapesjs/dist/css/grapes.min.css';

/* ────────────── DARK THEME OVERRIDES ────────────── */
const GJS_THEME_CSS = `
@keyframes gradientShift {
  0% { transform: scale(1) rotate(0deg); }
  100% { transform: scale(1.1) rotate(3deg); }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
:root {
.gjs-editor { background: #0a0a0a !important; }
.gjs-pn-commands, .gjs-pn-views, .gjs-pn-options { background: #1a1a1a !important; border-color: var(--gjs-dark-border) !important; }
.gjs-pn-btn { color: #8c8578 !important; fill: #8c8578 !important; }
.gjs-pn-btn.gjs-pn-active { color: #bfa24e !important; fill: #bfa24e !important; }
.gjs-block { background: #1a1a1a !important; border: 1px solid rgba(191,162,78,0.08) !important; border-radius: 10px !important; color: #f5f1e8 !important; }
.gjs-block:hover { border-color: rgba(191,162,78,0.3) !important; box-shadow: 0 0 15px rgba(191,162,78,0.1) !important; }
.gjs-block-label { color: #f5f1e8 !important; font-size: 11px !important; }
.gjs-block-category .gjs-title { background: #1a1a1a !important; color: #bfa24e !important; border-color: var(--gjs-dark-border) !important; font-weight: 700 !important; }
.gjs-block-category { border-color: var(--gjs-dark-border) !important; }
.gjs-cv-canvas { background: #0a0a0a !important; }
.gjs-frame-wrapper { border-radius: 8px !important; }
.gjs-layer { color: #f5f1e8 !important; }
.gjs-layer-item { background: transparent !important; border-color: rgba(191,162,78,0.06) !important; }
.gjs-layer-item:hover { background: rgba(191,162,78,0.06) !important; }
.gjs-layer-item .gjs-layer-title-c { color: #8c8578 !important; }
.gjs-sm-sector-title { background: #1a1a1a !important; color: #bfa24e !important; border-color: var(--gjs-dark-border) !important; font-weight: 700 !important; }
.gjs-sm-sector { background: #0a0a0a !important; border-color: var(--gjs-dark-border) !important; }
.gjs-sm-field { background: #1a1a1a !important; border: 1px solid rgba(191,162,78,0.1) !important; color: #f5f1e8 !important; }
.gjs-sm-label { color: #8c8578 !important; }
.gjs-selected { outline: 2px solid rgba(191,162,78,0.5) !important; }
.gjs-hovered { outline: 1px solid rgba(191,162,78,0.3) !important; }
.gjs-composite { background: #1a1a1a !important; border-color: var(--gjs-dark-border) !important; }
.gjs-select option { background: #1a1a1a !important; color: #f5f1e8 !important; }
.gjs-field-input { color: #f5f1e8 !important; }
.gjs-field-color-picker { border-radius: 6px !important; }
.gjs-btn-prim { background: #bfa24e !important; color: #fff !important; border: none !important; border-radius: 8px !important; }
.gjs-trait-manager { background: #0a0a0a !important; }
.gjs-trait-category-title { background: #1a1a1a !important; color: #bfa24e !important; border-color: var(--gjs-dark-border) !important; }
.gjs-trait-header { background: #1a1a1a !important; border-color: var(--gjs-dark-border) !important; }
.gjs-trait-label { color: #8c8578 !important; }
.gjs-field-input input, .gjs-field-input textarea { color: #f5f1e8 !important; background: #1a1a1a !important; }
.gjs-select select { color: #f5f1e8 !important; background: #1a1a1a !important; }
.gjs-toolbar { background: #1a1a1a !important; border: 1px solid rgba(191,162,78,0.2) !important; border-radius: 8px !important; }
.gjs-toolbar i { color: #f5f1e8 !important; }
.gjs-traits-lbl { color: #8c8578 !important; }
`;

const STORE_KEY = 'delivery_storefront_layout';

/* ────────────── HTML TEMPLATES ────────────── */
const HERO_HTML = ({ title, subtitle, btnText, btnUrl, videoUrl, overlay }: any = {}) => `
<div style="padding:80px 40px;text-align:center;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%);color:#f5f1e8;font-family:Inter,sans-serif;position:relative;overflow:hidden" class="gjs-hero-section">
  ${videoUrl ? `<video autoplay muted loop style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0"><source src="${videoUrl}"></video>` : ''}
  <div style="position:absolute;inset:0;opacity:0.15;background:radial-gradient(circle at 30% 50%,#bfa24e 0%,transparent 60%);z-index:${videoUrl ? 1 : 0}"></div>
  <div style="position:relative;z-index:2;max-width:800px;margin:0 auto">
    <h1 style="font-size:2.8rem;font-weight:800;margin:0 0 16px;font-family:'Unbounded',sans-serif;line-height:1.15" class="gjs-hero-title">${title || 'Bienvenue chez MISTER-DR'}</h1>
    <p style="font-size:1.1rem;color:#8c8578;margin:0 0 28px;line-height:1.6">${subtitle || 'Découvrez une sélection exceptionnelle de produits livrés chez vous.'}</p>
    <a href="${btnUrl || '#'}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#bfa24e,#8a7530);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem">${btnText || 'Explorer la boutique'}</a>
  </div>
</div>`;

const GRID_HTML = (cols = 3) => `
<div style="padding:40px;background:transparent;font-family:Inter,sans-serif" class="gjs-product-grid">
  <h2 style="font-size:1.4rem;font-weight:700;margin:0 0 20px;color:#f5f1e8;font-family:'Unbounded',sans-serif">Nos Produits</h2>
  <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px">
    ${Array.from({length:cols}, (_,i) => `
    <div style="background:#1a1a1a;border-radius:10px;overflow:hidden;border:1px solid rgba(191,162,78,0.1)">
      <div style="aspect-ratio:1;background:#222;display:flex;align-items:center;justify-content:center;color:#555;font-size:0.8rem">Image ${i+1}</div>
      <div style="padding:10px">
        <p style="font-size:0.85rem;font-weight:600;margin:0 0 4px;color:#f5f1e8">Produit ${i+1}</p>
        <p style="font-size:0.95rem;font-weight:700;margin:0;color:#bfa24e">${(i+1)*1200} DA</p>
      </div>
    </div>`).join('')}
  </div>
</div>`;

const FEATURES_HTML = `
<div style="padding:60px 40px;background:transparent;font-family:Inter,sans-serif;text-align:center" class="gjs-features">
  <h2 style="font-size:1.6rem;font-weight:700;margin:0 0 40px;color:#f5f1e8;font-family:'Unbounded',sans-serif">Pourquoi nous choisir</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto">
    ${['Livraison Rapide', 'Qualité Garantie', 'Service Client'].map((t,i) => `
    <div style="padding:24px;background:#1a1a1a;border-radius:12px;border:1px solid rgba(191,162,78,0.08)">
      <div style="width:44px;height:44px;border-radius:10px;background:rgba(191,162,78,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:20px">${['🚚','⭐','💬'][i]}</div>
      <h3 style="font-size:0.95rem;font-weight:700;margin:0 0 6px;color:#f5f1e8">${t}</h3>
      <p style="font-size:0.8rem;color:#8c8578;margin:0;line-height:1.5">Description de ${t.toLowerCase()} pour votre boutique.</p>
    </div>`).join('')}
  </div>
</div>`;

const CTA_HTML = `
<div style="padding:60px 40px;text-align:center;background:linear-gradient(135deg,#bfa24e,#8a7530);color:#fff;font-family:Inter,sans-serif" class="gjs-cta-section">
  <h2 style="font-size:1.8rem;font-weight:800;margin:0 0 12px;font-family:'Unbounded',sans-serif">Prêt à commander ?</h2>
  <p style="font-size:1rem;margin:0 0 24px;opacity:0.9">Rejoignez nos clients satisfaits dès aujourd'hui.</p>
  <a href="#" style="display:inline-block;padding:14px 36px;background:#fff;color:#8a7530;border-radius:10px;text-decoration:none;font-weight:700;font-size:0.95rem">Commander maintenant</a>
</div>`;

const CONTACT_HTML = `
<div style="padding:60px 40px;background:transparent;font-family:Inter,sans-serif;text-align:center" class="gjs-contact">
  <h2 style="font-size:1.4rem;font-weight:700;margin:0 0 8px;color:#f5f1e8;font-family:'Unbounded',sans-serif">Contactez-nous</h2>
  <p style="font-size:0.9rem;color:#8c8578;margin:0 0 28px">Une question ? Notre équipe est là pour vous.</p>
  <div style="max-width:500px;margin:0 auto">
    <div style="display:flex;flex-direction:column;gap:10px">
      <input placeholder="Votre nom" style="padding:12px 16px;border-radius:10px;border:1px solid rgba(191,162,78,0.12);background:#1a1a1a;color:#f5f1e8;font-size:0.9rem">
      <input placeholder="Votre email" style="padding:12px 16px;border-radius:10px;border:1px solid rgba(191,162,78,0.12);background:#1a1a1a;color:#f5f1e8;font-size:0.9rem">
      <textarea placeholder="Votre message" rows={3} style="padding:12px 16px;border-radius:10px;border:1px solid rgba(191,162,78,0.12);background:#1a1a1a;color:#f5f1e8;font-size:0.9rem"></textarea>
      <button style="padding:12px;border-radius:10px;background:linear-gradient(135deg,#bfa24e,#8a7530);color:#fff;border:none;font-weight:700;font-size:0.95rem;cursor:pointer">Envoyer</button>
    </div>
  </div>
</div>`;

const ICON_HTML = (name = 'Star', size = 48) => `
<div style="display:flex;justify-content:center;padding:20px" class="gjs-icon-block">
  <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:rgba(191,162,78,0.1);border-radius:12px;color:#bfa24e;font-size:${size*0.5}px" data-icon="${name}">${getIconSvg(name)}</div>
</div>`;

function getIconSvg(name: string): string {
  const icons: Record<string, string> = {
    Star: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    ShoppingCart: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    Truck: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    Heart: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    Zap: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    Shield: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    Gift: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
    Phone: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    Mail: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    MapPin: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    Clock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    Users: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  };
  return icons[name] || icons.Star;
}

const ICON_NAMES = ['Star','ShoppingCart','Truck','Heart','Zap','Shield','Gift','Phone','Mail','MapPin','Clock','Users'];

const GRADIENT_HERO_HTML = `
<div style="padding:100px 40px;text-align:center;position:relative;overflow:hidden;font-family:Inter,sans-serif;background:linear-gradient(135deg,#0a0a2e 0%,#1a0a2e 30%,#0a0a0a 70%)" class="gjs-gradient-hero">
  <div style="position:absolute;inset:0;opacity:0.4;background:radial-gradient(ellipse at 20% 50%,#bfa24e 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,#4a2080 0%,transparent 50%),radial-gradient(ellipse at 50% 80%,#1a4a6e 0%,transparent 50%);animation:gradientShift 8s ease-in-out infinite alternate"></div>
  <div style="position:relative;z-index:1">
    <span style="display:inline-block;padding:6px 16px;border-radius:999px;font-size:0.75rem;font-weight:600;background:rgba(191,162,78,0.15);color:#bfa24e;margin-bottom:20px;letter-spacing:0.5px;text-transform:uppercase">Nouvelle collection</span>
    <h1 style="font-size:3.2rem;font-weight:800;margin:0 0 16px;font-family:'Unbounded',sans-serif;background:linear-gradient(135deg,#f5f1e8,#bfa24e);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1.1">L'élégance à portée de main</h1>
    <p style="font-size:1.1rem;color:rgba(245,241,232,0.7);margin:0 0 32px;max-width:600px;margin-left:auto;margin-right:auto">Des produits soigneusement sélectionnés pour ceux qui exigent le meilleur.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#bfa24e,#8a7530);color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Découvrir</a>
      <a style="display:inline-block;padding:14px 36px;background:rgba(255,255,255,0.08);color:#f5f1e8;border-radius:10px;text-decoration:none;font-weight:600;border:1px solid rgba(191,162,78,0.2)">En savoir plus</a>
    </div>
  </div>
</div>`;

const BENTO_GRID_HTML = `
<div style="padding:60px 40px;background:transparent;font-family:Inter,sans-serif" class="gjs-bento-grid">
  <h2 style="font-size:1.6rem;font-weight:700;margin:0 0 32px;color:#f5f1e8;font-family:'Unbounded',sans-serif;text-align:center">Notre offre</h2>
  <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;max-width:900px;margin:0 auto">
    <div style="grid-row:span 2;background:linear-gradient(135deg,#1a1a2e,#0d0d1a);border-radius:16px;padding:32px;border:1px solid rgba(191,162,78,0.08);display:flex;flex-direction:column;justify-content:flex-end;min-height:280px">
      <div style="font-size:2rem;margin-bottom:12px">👑</div>
      <h3 style="font-size:1.2rem;font-weight:700;margin:0 0 6px;color:#f5f1e8">Collection Premium</h3>
      <p style="font-size:0.85rem;color:#8c8578;margin:0">Découvrez nos articles les plus exclusifs.</p>
    </div>
    <div style="background:#1a1a1a;border-radius:16px;padding:24px;border:1px solid rgba(191,162,78,0.08)">
      <div style="font-size:1.5rem;margin-bottom:8px">🚚</div>
      <h3 style="font-size:0.95rem;font-weight:700;margin:0 0 4px;color:#f5f1e8">Livraison rapide</h3>
      <p style="font-size:0.8rem;color:#8c8578;margin:0">Sous 24h à 48h</p>
    </div>
    <div style="background:#1a1a1a;border-radius:16px;padding:24px;border:1px solid rgba(191,162,78,0.08)">
      <div style="font-size:1.5rem;margin-bottom:8px">⭐</div>
      <h3 style="font-size:0.95rem;font-weight:700;margin:0 0 4px;color:#f5f1e8">Qualité garantie</h3>
      <p style="font-size:0.8rem;color:#8c8578;margin:0">100% satisfait</p>
    </div>
  </div>
</div>`;

const GLASS_CARDS_HTML = `
<div style="padding:60px 40px;font-family:Inter,sans-serif;text-align:center;position:relative;overflow:hidden" class="gjs-glass-section">
  <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(191,162,78,0.06) 0%,transparent 60%)"></div>
  <div style="position:relative;z-index:1">
    <h2 style="font-size:1.5rem;font-weight:700;margin:0 0 32px;color:#f5f1e8;font-family:'Unbounded',sans-serif">Services</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:800px;margin:0 auto">
      ${['Support 24/7','Paiement sécurisé','Retour gratuit'].map((t,i) => `
      <div style="padding:28px 20px;border-radius:16px;background:rgba(26,26,26,0.6);border:1px solid rgba(191,162,78,0.1);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)">
        <div style="width:48px;height:48px;border-radius:12px;background:rgba(191,162,78,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:22px">${['🎧','🔒','📦'][i]}</div>
        <h3 style="font-size:0.95rem;font-weight:700;margin:0 0 6px;color:#f5f1e8">${t}</h3>
        <p style="font-size:0.8rem;color:#8c8578;margin:0">Description du service ${t.toLowerCase()}.</p>
      </div>`).join('')}
    </div>
  </div>
</div>`;

const TESTIMONIALS_HTML = `
<div style="padding:60px 40px;background:transparent;font-family:Inter,sans-serif;text-align:center" class="gjs-testimonials">
  <h2 style="font-size:1.5rem;font-weight:700;margin:0 0 32px;color:#f5f1e8;font-family:'Unbounded',sans-serif">Ils nous font confiance</h2>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;max-width:700px;margin:0 auto">
    ${[1,2,3,4].map(i => `
    <div style="padding:20px;background:#1a1a1a;border-radius:12px;border:1px solid rgba(191,162,78,0.06);text-align:left">
      <div style="display:flex;gap:2px;margin-bottom:8px">${'★'.repeat(5)}</div>
      <p style="font-size:0.85rem;color:#8c8578;margin:0 0 10px;line-height:1.5;font-style:italic">"Excellent service client et produits de qualité. Je recommande!"</p>
      <p style="font-size:0.8rem;font-weight:600;color:#f5f1e8;margin:0">— Client satisfait</p>
    </div>`).join('')}
  </div>
</div>`;

const FOOTER_HTML = `
<div style="padding:40px;background:#0d0d0d;color:#8c8578;font-family:Inter,sans-serif;text-align:center;border-top:1px solid rgba(191,162,78,0.08)" class="gjs-footer">
  <p style="font-size:0.85rem;margin:0 0 6px;font-family:'Unbounded',sans-serif;color:#f5f1e8;font-weight:700">MISTER-DR</p>
  <p style="font-size:0.75rem;margin:0">&copy; ${new Date().getFullYear()} Tous droits réservés.</p>
  <div style="display:flex;justify-content:center;gap:16px;margin-top:12px">
    <a href="#" style="color:#8c8578;text-decoration:none;font-size:0.75rem">Livraison</a>
    <a href="#" style="color:#8c8578;text-decoration:none;font-size:0.75rem">Contact</a>
    <a href="#" style="color:#8c8578;text-decoration:none;font-size:0.75rem">CGV</a>
  </div>
</div>`;

/* ────────────── REGISTER COMPONENT TYPES ────────────── */
function registerComponentTypes(editor: Editor) {
  const domc = editor.DomComponents;

  /* Hero component */
  domc.addType('gjs-hero', {
    model: {
      defaults: {
        draggable: true,
        droppable: false,
        traits: [
          { type: 'text', name: 'title', label: 'Titre' },
          { type: 'text', name: 'subtitle', label: 'Sous-titre' },
          { type: 'text', name: 'btnText', label: 'Texte bouton' },
          { type: 'text', name: 'btnUrl', label: 'Lien bouton' },
          { type: 'text', name: 'videoUrl', label: 'URL vidéo fond' },
          { type: 'color', name: 'overlay', label: 'Couleur overlay' },
        ],
      },
    },
    view: {
      init() { this.listenTo(this.model, 'change:title change:subtitle change:btnText change:btnUrl change:videoUrl change:overlay', this.updateContent); },
      updateContent() {
        const m = this.model;
        this.el.innerHTML = HERO_HTML({
          title: m.get('title') || 'Bienvenue chez MISTER-DR',
          subtitle: m.get('subtitle') || '',
          btnText: m.get('btnText') || 'Explorer la boutique',
          btnUrl: m.get('btnUrl') || '#',
          videoUrl: m.get('videoUrl') || '',
          overlay: m.get('overlay') || '',
        });
      },
    },
  });

  /* Icon component */
  domc.addType('gjs-icon', {
    model: {
      defaults: {
        draggable: true,
        droppable: false,
        traits: [
          {
            type: 'select',
            name: 'icon',
            label: 'Icône',
            options: ICON_NAMES.map(n => ({ value: n, name: n })),
          },
          { type: 'number', name: 'size', label: 'Taille', min: 16, max: 128, step: 8 },
          { type: 'color', name: 'color', label: 'Couleur' },
        ],
      },
    },
    view: {
      init() { this.listenTo(this.model, 'change:icon change:size change:color', this.updateContent); },
      updateContent() {
        const m = this.model;
        const name = m.get('icon') || 'Star';
        const size = m.get('size') || 48;
        const color = m.get('color') || '#bfa24e';
        this.el.innerHTML = `<div style="display:flex;justify-content:center;padding:16px"><div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:rgba(191,162,78,0.1);border-radius:12px;color:${color}">${getIconSvg(name)}</div></div>`;
      },
    },
  });

  /* Features grid */
  domc.addType('gjs-features', {
    model: {
      defaults: { draggable: true, droppable: true },
    },
    view: {
      init() { /* static content for now */ },
    },
  });
}

/* ────────────── MAIN EDITOR COMPONENT ────────────── */
export default function StorefrontBuilder() {
  const editorRef = useRef<Editor | null>(null);
  const [ready, setReady] = useState(false);
  const styleElRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GJS_THEME_CSS;
    document.head.appendChild(style);
    styleElRef.current = style;
    return () => style.remove();
  }, []);

  const onEditor = useCallback((editor: Editor) => {
    editorRef.current = editor;

    /* ── Load saved layout ── */
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.components?.length) editor.setComponents(data.components);
        if (data.styles?.length) editor.setStyle(data.styles);
      }
    } catch {}

    /* ── Register custom component types ── */
    registerComponentTypes(editor);

    /* ── Blocks ── */
    const bm = editor.BlockManager;

    bm.add('hero', {
      label: 'Hero', content: HERO_HTML({}),
      category: 'Sections', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="2" y="3" width="20" height="18" rx="2" stroke="#bfa24e" stroke-width="1.5"/><text x="7" y="16" font-size="7" fill="#bfa24e">Hero</text></svg>`,
    });

    bm.add('product-grid', {
      label: 'Produits', content: GRID_HTML(3),
      category: 'Sections', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="2" y="2" width="9" height="9" rx="1.5" stroke="#bfa24e" stroke-width="1.5"/><rect x="13" y="2" width="9" height="9" rx="1.5" stroke="#bfa24e" stroke-width="1.5"/><rect x="2" y="13" width="9" height="9" rx="1.5" stroke="#bfa24e" stroke-width="1.5"/><rect x="13" y="13" width="9" height="9" rx="1.5" stroke="#bfa24e" stroke-width="1.5"/></svg>`,
    });

    bm.add('category-bar', {
      label: 'Catégories', content: `<div style="padding:20px 40px;font-family:Inter,sans-serif"><div style="display:flex;gap:8px"><span style="padding:8px 20px;border-radius:999px;font-size:0.85rem;font-weight:600;background:#bfa24e;color:#fff">Tout</span><span style="padding:8px 20px;border-radius:999px;font-size:0.85rem;background:rgba(191,162,78,0.1);color:#8c8578">Catégorie</span><span style="padding:8px 20px;border-radius:999px;font-size:0.85rem;background:rgba(191,162,78,0.1);color:#8c8578">Catégorie</span></div></div>`,
      category: 'Sections', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="2" y="6" width="5" height="5" rx="2.5" stroke="#bfa24e" stroke-width="1.5"/><rect x="9.5" y="6" width="5" height="5" rx="2.5" stroke="#bfa24e" stroke-width="1.5"/><rect x="17" y="6" width="5" height="5" rx="2.5" stroke="#bfa24e" stroke-width="1.5"/></svg>`,
    });

    bm.add('features', {
      label: 'Features', content: FEATURES_HTML,
      category: 'Sections', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="2" y="2" width="6" height="6" rx="1" stroke="#bfa24e" stroke-width="1.5"/><rect x="9" y="2" width="6" height="6" rx="1" stroke="#bfa24e" stroke-width="1.5"/><rect x="16" y="2" width="6" height="6" rx="1" stroke="#bfa24e" stroke-width="1.5"/></svg>`,
    });

    bm.add('cta', {
      label: 'CTA', content: CTA_HTML,
      category: 'Sections', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#bfa24e" stroke-width="1.5"/><text x="7" y="16" font-size="6" fill="#bfa24e" font-weight="bold">CTA</text></svg>`,
    });

    bm.add('contact', {
      label: 'Contact', content: CONTACT_HTML,
      category: 'Sections', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#bfa24e" stroke-width="1.5"/><polyline points="22,6 12,13 2,6" stroke="#bfa24e" stroke-width="1.5"/></svg>`,
    });

    bm.add('footer', {
      label: 'Footer', content: FOOTER_HTML,
      category: 'Sections', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#bfa24e" stroke-width="1.5"/><line x1="2" y1="14" x2="22" y2="14" stroke="#bfa24e" stroke-width="1.5"/></svg>`,
    });

    /* ── Premium Sections ── */
    bm.add('gradient-hero', {
      label: 'Hero Premium', content: GRADIENT_HERO_HTML,
      category: '⭐ Premium', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="2" y="3" width="20" height="18" rx="2" stroke="#d4b96a" stroke-width="1.5"/><text x="5" y="15" font-size="6" fill="#d4b96a">★</text></svg>`,
    });

    bm.add('bento-grid', {
      label: 'Bento Grid', content: BENTO_GRID_HTML,
      category: '⭐ Premium', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="2" y="2" width="14" height="20" rx="2" stroke="#d4b96a" stroke-width="1.5"/><rect x="18" y="2" width="4" height="9" rx="1" stroke="#d4b96a" stroke-width="1.5"/><rect x="18" y="13" width="4" height="9" rx="1" stroke="#d4b96a" stroke-width="1.5"/></svg>`,
    });

    bm.add('glass-cards', {
      label: 'Glass Cards', content: GLASS_CARDS_HTML,
      category: '⭐ Premium', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="2" y="4" width="6" height="16" rx="2" fill="rgba(191,162,78,0.1)" stroke="#d4b96a" stroke-width="1.5"/><rect x="9" y="4" width="6" height="16" rx="2" fill="rgba(191,162,78,0.1)" stroke="#d4b96a" stroke-width="1.5"/><rect x="16" y="4" width="6" height="16" rx="2" fill="rgba(191,162,78,0.1)" stroke="#d4b96a" stroke-width="1.5"/></svg>`,
    });

    bm.add('testimonials', {
      label: 'Avis clients', content: TESTIMONIALS_HTML,
      category: '⭐ Premium', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#d4b96a" stroke-width="1.5"/></svg>`,
    });

    /* ── Elements ── */
    bm.add('icon', {
      label: 'Icône',
      content: { type: 'gjs-icon', icon: 'Star', size: 48 },
      category: 'Éléments', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#bfa24e" stroke-width="1.5"/></svg>`,
    });

    bm.add('text-block', {
      label: 'Texte', content: `<div style="padding:32px;font-family:Inter,sans-serif;text-align:center"><h2 style="font-size:1.5rem;font-weight:700;margin:0 0 8px;color:#f5f1e8;font-family:'Unbounded',sans-serif">Titre de section</h2><p style="font-size:0.95rem;color:#8c8578;margin:0;line-height:1.6">Votre texte personnalisé ici.</p></div>`,
      category: 'Éléments', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#bfa24e" stroke-width="1.5"/><line x1="6" y1="9" x2="18" y2="9" stroke="#bfa24e" stroke-width="1.5"/><line x1="6" y1="13" x2="14" y2="13" stroke="#bfa24e" stroke-width="1.5"/></svg>`,
    });

    bm.add('image', {
      label: 'Image', content: `<div style="padding:40px;display:flex;justify-content:center"><div style="width:100%;max-width:600px;aspect-ratio:16/9;background:#222;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#555;border:1px solid rgba(191,162,78,0.1)">Image</div></div>`,
      category: 'Éléments', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="2" y="2" width="20" height="20" rx="3" stroke="#bfa24e" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="#bfa24e" stroke-width="1.5"/><path d="M2 16l4-4 3 3 4-5 7 8" stroke="#bfa24e" stroke-width="1.5"/></svg>`,
    });

    bm.add('divider', {
      label: 'Séparateur', content: `<div style="padding:24px 40px"><hr style="border:none;border-top:1px solid rgba(191,162,78,0.12);margin:0" /></div>`,
      category: 'Éléments', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><line x1="2" y1="12" x2="22" y2="12" stroke="#bfa24e" stroke-width="1.5"/></svg>`,
    });

    bm.add('spacer', {
      label: 'Espacement', content: `<div style="height:48px"></div>`,
      category: 'Éléments', media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="6" y="4" width="12" height="16" rx="2" stroke="#bfa24e" stroke-width="1.5" stroke-dasharray="3 3"/></svg>`,
    });

    setReady(true);
  }, []);

  const handleSave = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        components: editor.getComponents().toJSON(),
        styles: editor.getStyle(),
      }));
      toast.success('Layout sauvegardé !');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--admin-bg)' }}>
      {/* ══════ TOP TOOLBAR ══════ */}
      <div className="flex items-center gap-3 px-3 py-2 flex-shrink-0" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border2)' }}>
        <a href="/admin/editor/full" className="p-1.5 rounded-lg" style={{ color: 'var(--admin-muted)' }} title="Retour à l'éditeur">
          <Minimize2 size={16} />
        </a>
        <div className="h-5 w-px" style={{ background: 'var(--admin-border2)' }} />
        <p className="text-xs font-extrabold tracking-wide" style={{ fontFamily: "'Unbounded', sans-serif", background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          BUILDER
        </p>
        {ready && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(76,175,80,0.15)', color: '#4caf50' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4caf50' }} />
            Prêt
          </span>
        )}
        <div className="flex-1" />
        <button onClick={handleSave} disabled={!ready} className="gold-btn px-4 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
          <Save size={12} /> Sauvegarder
        </button>
      </div>

      {/* ══════ GRAPESJS EDITOR ══════ */}
      <div className="flex-1 relative">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'var(--admin-bg)' }}>
            <Loader size={24} className="animate-spin" style={{ color: 'var(--admin-gold)' }} />
          </div>
        )}
        <GjsEditor
          grapesjs={grapesjs}
          options={{
            height: '100%',
            storageManager: false,
            undoManager: { track: true },
            deviceManager: {
              devices: [
                { name: 'Desktop', width: '', priority: 1 },
                { name: 'Tablet', width: '768px', priority: 2 },
                { name: 'Mobile', width: '375px', priority: 3 },
              ],
            },
            selectorManager: { multiple: true },
            styleManager: {
              sectors: [
                { name: 'Dimension', open: false, buildProps: ['width', 'height', 'max-width', 'min-height', 'padding', 'margin'] },
                { name: 'Typography', open: false, buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'text-align', 'line-height'], properties: [
                  { name: 'font-family', property: 'font-family', type: 'select', defaults: 'Inter, sans-serif', options: [
                    { value: 'Inter, sans-serif', name: 'Inter' },
                    { value: "'Unbounded', sans-serif", name: 'Unbounded' },
                    { value: 'Poppins, sans-serif', name: 'Poppins' },
                    { value: "'Space Grotesk', sans-serif", name: 'Space Grotesk' },
                    { value: 'Manrope, sans-serif', name: 'Manrope' },
                  ]},
                ]},
                { name: 'Decorations', open: false, buildProps: ['border-radius', 'box-shadow', 'background-color', 'opacity', 'border'] },
                { name: 'Extra', open: false, buildProps: ['background', 'background-image'] },
              ],
            },
            canvas: {
              styles: ['https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap'],
            },
          }}
          onEditor={onEditor}
        />
      </div>
    </div>
  );
}
