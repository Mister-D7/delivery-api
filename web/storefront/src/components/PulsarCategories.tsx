import { useEffect, useRef, useState } from 'react';
import { useStorefront } from '../lib/storefront';
import { imgSrc } from '../lib/image';

const ICONS: [RegExp, string][] = [
  [/jeu|game|play|console|playstation|xbox|switch/i, '🎮'],
  [/télé|phone|smart|mobile|samsung|iphone/i, '📱'],
  [/charge|power|batterie|chargeur/i, '⚡'],
  [/pc|ordinateur|laptop|portable|écran|gaming pc/i, '💻'],
  [/écoute|audio|casque|enceinte/i, '🎧'],
  [/vêt|mode|chemise|t-shirt|robe|chaussure/i, '👕'],
  [/livre|book/i, '📚'],
];

function iconFor(name: string): string {
  for (const [re, ic] of ICONS) if (re.test(name)) return ic;
  return '🛒';
}

const FALLBACK_CATS = [
  { name: 'Jeux vidéo', imageUrl: null },
  { name: 'Accessoires', imageUrl: null },
  { name: 'Téléphones', imageUrl: null },
  { name: 'PC', imageUrl: null },
];

function isVedette(name: string) {
  return String(name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'vedette';
}

export default function PulsarCategories() {
  const { categories } = useStorefront();
  const cats = categories.length
    ? [...categories].sort((a, b) => (isVedette(b.name) ? 1 : 0) - (isVedette(a.name) ? 1 : 0)).slice(0, 20)
    : FALLBACK_CATS;
  const [isEdit, setIsEdit] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('edit')) {
      setIsEdit(true);
    }
  }, []);

  useEffect(() => {
    const onFilter = (e: Event) => {
      const detail = (e as CustomEvent<{ name?: string }>).detail;
      setActive(detail?.name && detail.name !== 'all' ? detail.name : null);
    };
    window.addEventListener('category:filter', onFilter as EventListener);
    return () => window.removeEventListener('category:filter', onFilter as EventListener);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let down = false;
    let startX = 0;
    let startLeft = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true;
      movedRef.current = 0;
      startX = e.clientX;
      startLeft = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
      track.classList.add('dragging');
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      track.scrollLeft = startLeft - dx;
      movedRef.current = Math.max(movedRef.current, Math.abs(dx));
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      track.classList.remove('dragging');
      if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
    };
    const onLeave = () => {
      down = false;
      track.classList.remove('dragging');
    };
    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onUp);
    track.addEventListener('pointercancel', onLeave);
    return () => {
      track.removeEventListener('pointerdown', onDown);
      track.removeEventListener('pointermove', onMove);
      track.removeEventListener('pointerup', onUp);
      track.removeEventListener('pointercancel', onLeave);
    };
  }, []);

  const select = (name: string) => {
    if (movedRef.current > 8) {
      movedRef.current = 0;
      return;
    }
    const next = active === name ? 'all' : name;
    setActive(next === 'all' ? null : name);
    window.dispatchEvent(new CustomEvent('category:filter', { detail: { name: next } }));
    if (next !== 'all') {
      const lineup = document.getElementById('lineup');
      lineup?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollBy = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const slots = Math.max(0, 8 - cats.length);

  return (
    <div className="cat-strip">
      <div className="cat-strip-track" ref={trackRef}>
        {cats.map((c) => (
          <div key={c.id || c.name} className="cat-cell">
            <button
              type="button"
              className={`cat-chip${active === c.name ? ' active' : ''}`}
              onClick={() => select(c.name)}
              data-edit-category={c.id || ''}
              data-cat-name={c.name}
            >
              {c.imageUrl ? (
                <img src={imgSrc(c.imageUrl)} alt={c.name} loading="lazy" />
              ) : (
                <span className="cat-emoji">{iconFor(c.name)}</span>
              )}
            </button>
            <span className="cat-chip-name">{c.name}</span>
          </div>
        ))}
        {isEdit &&
          Array.from({ length: slots }).map((_, i) => (
            <div key={`add-${i}`} className="cat-cell">
              <button
                type="button"
                className="cat-chip cat-add"
                onClick={() => window.dispatchEvent(new CustomEvent('category:edit', { detail: { id: null } }))}
              >
                <span className="cat-add-icon">
                  <span>+</span>
                </span>
              </button>
              <span className="cat-chip-name">Nouvelle</span>
            </div>
          ))}
      </div>
      <div className="cat-strip-nav">
        <button type="button" className="cat-nav" onClick={() => scrollBy(-1)} aria-label="Précédent" title="Précédent">
          ‹
        </button>
        <button type="button" className="cat-nav" onClick={() => scrollBy(1)} aria-label="Suivant" title="Suivant">
          ›
        </button>
      </div>
    </div>
  );
}
