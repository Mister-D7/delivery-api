import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Trash2 } from 'lucide-react';
import type { ThemeSettings, CatalogProduct, Category, SelectedElement } from './editorTypes';

type Props = {
  settings: ThemeSettings; hasBg: boolean;
  orderedProducts: CatalogProduct[]; orderedCategories: Category[];
  hoveredId: string | null; setHoveredId: (id: string | null) => void;
  selected: SelectedElement | null; setSelected: (el: SelectedElement | null) => void;
  rightOpen: boolean; setRightOpen: (open: boolean) => void;
  selectProduct: (p: CatalogProduct) => void;
  layoutSections: any[];
  onLayoutChange: (sections: any[]) => void;
};

const STORE_KEY = 'delivery_storefront_layout';

export default function EditorPreview({ settings, hasBg, orderedProducts, orderedCategories, hoveredId, setHoveredId, selected, setSelected, rightOpen, setRightOpen, selectProduct, layoutSections, onLayoutChange }: Props) {
  return (
    <div style={{ background: hasBg ? 'transparent' : settings.bgColor, fontFamily: settings.fontFamily, color: settings.textColor, borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 60px rgba(0,0,0,0.5)', position: 'relative' }}>
      {settings.backgroundType !== 'color' && settings.backgroundImage && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          {settings.backgroundType === 'video' ? (
            <video src={settings.backgroundImage} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${settings.backgroundImage}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
        </div>
      )}

      {/* ── Layout sections from builder ── */}
      {layoutSections.map((s: any, i: number) => (
        <div key={i} style={{ position: 'relative', zIndex: 1 }}
          onMouseEnter={() => setHoveredId(`section-${i}`)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => { setSelected({ type: 'section', id: `section-${i}`, data: s }); if (!rightOpen) setRightOpen(true); }}>
          {(hoveredId === `section-${i}` || selected?.id === `section-${i}`) && (
            <div className="absolute inset-0 border-2 pointer-events-none z-10" style={{ borderColor: selected?.id === `section-${i}` ? settings.accentColor : settings.accentColor + '80', borderStyle: selected?.id === `section-${i}` ? 'solid' : 'dashed' }} />
          )}
          {selected?.id === `section-${i}` && (
            <button onClick={(e) => { e.stopPropagation(); onLayoutChange(layoutSections.filter((_: any, j: number) => j !== i)); setSelected(null); }}
              className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(217,96,59,0.9)', color: '#fff' }}>
              <Trash2 size={10} />
            </button>
          )}
          <div dangerouslySetInnerHTML={{ __html: s.content || '' }} />
        </div>
      ))}

      <motion.div
        initial={settings.animationEnabled ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-16 px-8 relative"
        style={{ background: hasBg ? 'rgba(0,0,0,0.4)' : settings.surfaceColor, position: 'relative', zIndex: 1, ...(settings.glowEnabled ? { boxShadow: `inset 0 0 60px ${settings.glowColor}15, 0 0 40px ${settings.glowColor}10` } : {}) }}
        onMouseEnter={() => setHoveredId('hero')} onMouseLeave={() => setHoveredId(null)}
        onClick={() => { setSelected({ type: 'theme', id: 'hero', data: settings }); if (!rightOpen) setRightOpen(true); }}
      >
        {hoveredId === 'hero' && <div className="absolute inset-0 border-2 border-dashed rounded-lg pointer-events-none" style={{ borderColor: settings.accentColor + '80' }} />}
        {selected?.id === 'hero' && <div className="absolute inset-0 border-2 rounded-lg pointer-events-none" style={{ borderColor: settings.accentColor }} />}
        {settings.heroImage && <div className="rounded-xl overflow-hidden mb-4 mx-auto" style={{ maxWidth: 600, height: 140 }}><img src={settings.heroImage} alt="" className="w-full h-full object-cover" /></div>}
        <p className={`text-[10px] tracking-[0.3em] font-bold mb-3 ${settings.glowEnabled ? 'glow-active-text' : ''}`} style={{ color: settings.accentColor, fontFamily: "'IBM Plex Mono', monospace" }}>LIVRAISON RAPIDE</p>
        <h1 className="text-4xl font-extrabold leading-tight max-w-2xl mx-auto mb-3">{settings.bannerText}</h1>
        <p className="text-sm max-w-lg mx-auto" style={{ color: '#8c8578' }}>{settings.tagline}</p>
      </motion.div>

      {orderedCategories.length > 0 && (
        <div className="px-6 py-4 flex gap-2 overflow-x-auto" style={{ borderBottom: `1px solid ${settings.surfaceColor}`, position: 'relative', zIndex: 1, background: hasBg ? 'rgba(0,0,0,0.2)' : settings.surfaceColor, backdropFilter: hasBg && settings.glassEnabled ? 'blur(12px) saturate(1.2)' : 'none' }}>
          <span className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: settings.accentColor, color: settings.bgColor }}>Tout</span>
          {orderedCategories.map(c => (
            <span key={c.id} className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer" style={{ background: hasBg && settings.glassEnabled ? 'rgba(255,255,255,0.04)' : settings.surfaceColor, color: '#8c8578', backdropFilter: hasBg && settings.glassEnabled ? 'blur(8px)' : 'none' }}
              onMouseEnter={() => setHoveredId(`cat-${c.id}`)} onMouseLeave={() => setHoveredId(null)}
              onClick={() => { setSelected({ type: 'category', id: c.id, data: c }); if (!rightOpen) setRightOpen(true); }}
            >
              {hoveredId === `cat-${c.id}` && <span style={{ color: settings.accentColor }}>{c.name}</span>}
              {hoveredId !== `cat-${c.id}` && c.name}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 p-6" style={{ position: 'relative', zIndex: 1, background: hasBg ? 'transparent' : settings.bgColor }}>
        {orderedProducts.map((p, i) => (
          <motion.div key={p.id} layout
            initial={settings.animationEnabled ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: settings.animationEnabled ? i * 0.05 : 0 }}
            className="rounded-xl overflow-hidden cursor-pointer transition-all"
            style={{ background: hasBg && settings.glassEnabled ? 'rgba(255,255,255,0.04)' : settings.surfaceColor, backdropFilter: hasBg && settings.glassEnabled ? 'blur(12px) saturate(1.2)' : 'none', border: hasBg && settings.glassEnabled ? '1px solid rgba(255,255,255,0.05)' : 'none', boxShadow: (hoveredId === p.id || selected?.id === p.id) && settings.glowEnabled ? `0 0 24px ${settings.glowColor}25` : 'none', outline: selected?.id === p.id ? `2px solid ${settings.accentColor}` : hoveredId === p.id ? `1px dashed ${settings.accentColor}60` : 'none', outlineOffset: selected?.id === p.id ? 2 : 0 }}
            onMouseEnter={() => setHoveredId(p.id)} onMouseLeave={() => setHoveredId(null)}
            onClick={() => selectProduct(p)}
          >
            <div className="aspect-square relative" style={{ background: settings.bgColor }}>
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package size={28} style={{ color: '#333' }} /></div>}
              {p.promoPrice != null && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#d9603b', color: '#fff' }}>-{Math.round((1 - p.promoPrice / p.salePrice) * 100)}%</span>}
              {p.stockQty <= 0 && <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}><span className="text-[10px] font-bold" style={{ color: '#d9603b' }}>Rupture</span></div>}
            </div>
            <div className="p-3">
              <h3 className="text-xs font-semibold truncate mb-2" style={{ minHeight: 30 }}>{p.name}</h3>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-sm font-bold" style={{ color: settings.accentColor }}>{p.promoPrice ?? p.salePrice} DA</span>
                  {p.promoPrice != null && <span className="text-[10px] line-through ml-1" style={{ color: '#555' }}>{p.salePrice} DA</span>}
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: settings.accentColor, color: settings.bgColor }}>
                  <Plus size={12} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {orderedProducts.length === 0 && (
        <div className="text-center py-20" style={{ position: 'relative', zIndex: 1, background: settings.bgColor }}>
          <Package size={40} className="mx-auto mb-3" style={{ color: '#333' }} />
          <p className="text-sm">Aucun produit</p>
        </div>
      )}
    </div>
  );
}
