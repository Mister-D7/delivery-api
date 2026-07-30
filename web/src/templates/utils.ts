import type { Template } from './index';

export interface RenderState {
  storeName: string;
  bannerText: string;
  tagline: string;
  heroImage: string;
  accentColor: string;
  fontFamily: string;
  bgColor: string;
  textColor: string;
  products: { name: string; price: number; oldPrice?: number; imageUrl?: string; category?: string }[];
  categories: { id: string; name: string; imageUrl?: string }[];
}

export function renderTemplate(template: Template, state: RenderState): string {
  let html = template.html;

  /* ── Text placeholders ── */
  html = html.replace(/\{\{STORE_NAME\}\}/g, state.storeName || 'Ma Boutique');
  html = html.replace(/\{\{HERO_TITLE\}\}/g, state.bannerText || 'Bienvenue');
  html = html.replace(/\{\{TAGLINE\}\}/g, state.tagline || '');
  html = html.replace(/\{\{HERO_IMAGE\}\}/g, state.heroImage || '');

  /* ── Products grid ── */
  const productRows = state.products.map((p, i) => generateProductCard(p, i)).join('\n');
  html = html.replace(/\{\{PRODUCTS\}\}/g, productRows);

  /* ── Categories ── */
  const catPills = state.categories.map(c => generateCategoryPill(c)).join('\n');
  html = html.replace(/\{\{CATEGORIES\}\}/g, catPills);

  /* ── Inject data script before </body> ── */
  const dataScript = `<script>
window.__DATA__ = ${JSON.stringify({
    products: state.products,
    categories: state.categories,
  })};
window.__STORE__ = ${JSON.stringify({
    name: state.storeName,
    accentColor: state.accentColor,
    fontFamily: state.fontFamily,
    bgColor: state.bgColor,
    textColor: state.textColor,
  })};
<\\/script>`;
  html = html.replace('</body>', dataScript + '\n</body>');

  /* ── CSS variable overrides for custom colors ── */
  if (state.accentColor || state.fontFamily || state.bgColor || state.textColor) {
    const overrideStyle = `<style id="theme-overrides">
:root {
  ${state.accentColor ? `--accent: ${state.accentColor};` : ''}
  ${state.fontFamily ? `font-family: ${state.fontFamily};` : ''}
  ${state.bgColor ? `--bg: ${state.bgColor};` : ''}
  ${state.textColor ? `--ink: ${state.textColor};` : ''}
}
</style>`;
    html = html.replace('</head>', overrideStyle + '\n</head>');
  }

  return html;
}

function generateProductCard(p: { name: string; price: number; oldPrice?: number; imageUrl?: string; category?: string }, idx: number): string {
  const oldPriceHtml = p.oldPrice ? `<span class="old">${p.oldPrice}€</span>` : '';
  const imageHtml = p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">`
    : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#e0e0e0,#b0b0b0);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#888;font-size:12px">Image</div>`;
  return `<div class="card" style="animation-delay:${idx * 0.04}s">
    <div class="card-media" style="position:relative;overflow:hidden;aspect-ratio:1">
      ${imageHtml}
    </div>
    <div class="card-body">
      <h3>${p.name}</h3>
      ${p.category ? `<p style="font-size:11px;color:var(--muted,#999);margin:2px 0">${p.category}</p>` : ''}
      <div class="price-row"><span class="now">${p.price}€</span>${oldPriceHtml}</div>
    </div>
  </div>`;
}

function generateCategoryPill(c: { id: string; name: string }): string {
  return `<button class="cat-pill">${c.name}</button>`;
}
