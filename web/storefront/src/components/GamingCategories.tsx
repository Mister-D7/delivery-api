import type { ReactNode } from 'react';
import { useStorefront } from '../lib/storefront';
import HScroll from './HScroll';

const CURATED = [
  { name: 'Consoles', icon: 'gamepad' },
  { name: 'Manettes & Pads', icon: 'controller' },
  { name: 'Casques Gaming', icon: 'headset' },
  { name: 'Chaises Gaming', icon: 'chair' },
];

function SvgForIcon(icon: string) {
  const paths: Record<string, ReactNode> = {
    gamepad: (
      <>
        <path d="M15 5H9a7 7 0 0 0 0 14h6a7 7 0 0 0 0-14Z" />
        <circle cx="9" cy="12" r="1" />
        <circle cx="12" cy="9" r="1" />
        <circle cx="15" cy="12" r="1" />
        <circle cx="12" cy="15" r="1" />
      </>
    ),
    controller: (
      <>
        <rect x="2" y="7" width="20" height="10" rx="5" />
        <path d="M7 10h.01M10 7.5v.01M16 10h.01M18 12.5v.01M10 12.5v.01M13 14h.01" />
      </>
    ),
    headset: (
      <>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <rect x="2" y="14" width="5" height="6" rx="2" />
        <rect x="17" y="14" width="5" height="6" rx="2" />
        <path d="M19 20a4 4 0 0 1-4 3h-2" />
      </>
    ),
    chair: (
      <>
        <path d="M6 3h12v6a6 6 0 0 1-12 0Z" />
        <path d="M4 9h16M4 9l-1 8M20 9l1 8M7 17v4M17 17v4" />
      </>
    ),
  };
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[icon] ?? null}
    </svg>
  );
}

export default function GamingCategories() {
  const { categories, settings } = useStorefront();
  const catScale = (((settings as any).layout?.categoryScale) || {}) as Record<string, number>;
  const texts = (settings.texts ?? {}) as Record<string, string>;

  const pick = (name: string) => {
    window.dispatchEvent(new CustomEvent('category:filter', { detail: { name } }));
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="categories-container" id="categories">
      <h2 className="categories-title" data-edit-text="topCategoriesTitle" data-text-key="topCategoriesTitle">
        {texts.topCategoriesTitle || 'Top Categories'}
      </h2>
      <HScroll className="categories-grid" ariaLabel="Top Categories">
        {CURATED.map((c) => {
          const match = categories.find(
            (cat) => String(cat.name || '').toLowerCase() === c.name.toLowerCase()
          );
          return (
            <button
              key={c.name}
              type="button"
              className="category-card"
              onClick={() => pick(c.name)}
              aria-label={c.name}
              data-edit-category={match?.id || ''}
              data-cat-name={c.name}
            >
              <span
                className="category-icon"
                style={match?.id && catScale[match.id] ? { transform: 'scale(' + catScale[match.id] + ')' } : undefined}
              >
                {SvgForIcon(c.icon)}
              </span>
              <span className="category-label">{c.name}</span>
            </button>
          );
        })}
      </HScroll>
    </div>
  );
}
