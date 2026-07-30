import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Save, Palette, Type, Image, PaintBucket, Globe,
  Package, Layers, PanelRightClose, PanelRightOpen,
  RefreshCw, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { RawCatalog, CatalogProduct, Category, ThemeSettings } from './editorTypes';
import { THEME_DEFAULTS, FONTS, PRESETS } from './editorTypes';
import { getTemplates, getTemplate } from '../../templates';
import type { Template } from '../../templates';
import { renderTemplate } from '../../templates/utils';
import type { RenderState } from '../../templates/utils';

type Tool = 'themes' | 'text' | 'image' | 'color' | 'font' | 'products' | 'categories' | null;

export default function StorefrontEditor({ fullScreen }: { fullScreen?: boolean }) {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    try {
      const raw = localStorage.getItem('delivery_storefront_theme');
      if (raw) return { ...THEME_DEFAULTS, ...JSON.parse(raw) };
    } catch {}
    return THEME_DEFAULTS;
  });
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<Tool>('themes');
  const [panelOpen, setPanelOpen] = useState(true);
  const [blobUrl, setBlobUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const storeType = useMemo(() => {
    try { return localStorage.getItem('delivery_store_type') || 'tech'; } catch { return 'tech'; }
  }, []);

  const template = useMemo(() => {
    const saved = localStorage.getItem('delivery_selected_template');
    if (saved) {
      const t = getTemplate(saved);
      if (t) return t;
    }
    const all = getTemplates();
    const matching = all.filter(t => t.storeType === storeType);
    return matching[0] || all[0] || null;
  }, [storeType]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        api.get('/catalog').then(r => setCatalog((r.data || []).map((raw: RawCatalog): CatalogProduct => {
          const p = raw.product;
          return {
            id: raw.id, name: raw.name || p?.name || 'Produit',
            salePrice: raw.salePrice ?? p?.salePrice ?? 0,
            imageUrl: raw.imageUrl || p?.imageUrl || null,
            stockQty: raw.stockQty ?? p?.stockQty ?? 0,
            category: raw.category || null,
            barcode: raw.barcode || p?.barcode || null,
            displayOrder: raw.displayOrder, isActive: raw.isActive,
            promoPrice: raw.promoPrice ?? null, costPrice: raw.costPrice ?? null,
            customName: raw.customName || null, customPrice: raw.customPrice ?? null,
            customDescription: raw.customDescription || null,
            productId: raw.productId || null, specs: raw.specs || null,
          };
        }))),
        api.get('/categories/public').then(r => setCategories(r.data || [])),
      ]);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const renderState: RenderState = useMemo(() => ({
    storeName: settings.storeName || 'Ma Boutique',
    bannerText: settings.bannerText || 'Bienvenue',
    tagline: settings.tagline || '',
    heroImage: settings.heroImage || '',
    accentColor: settings.accentColor,
    fontFamily: settings.fontFamily,
    bgColor: settings.bgColor,
    textColor: settings.textColor,
    products: catalog.filter(p => p.isActive !== false).map(p => ({
      name: p.name,
      price: p.promoPrice ?? p.salePrice,
      oldPrice: p.promoPrice ? p.salePrice : undefined,
      imageUrl: p.imageUrl || undefined,
      category: p.category?.name,
    })),
    categories: categories.map(c => ({ id: c.id, name: c.name, imageUrl: c.imageUrl || undefined })),
  }), [settings, catalog, categories]);

  useEffect(() => {
    if (!template) return;
    const html = renderTemplate(template, renderState, window.location.origin + '/');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
  }, [template, renderState]);

  const selectTemplate = (t: Template) => {
    try { localStorage.setItem('delivery_selected_template', t.id); } catch {}
    window.location.reload();
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem('delivery_storefront_theme', JSON.stringify(settings));
      toast.success('Sauvegardé !');
    } catch { toast.error('Erreur'); }
  };

  const handleColorChange = (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }));
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSettings(s => ({
      ...s, bgColor: preset.bg, surfaceColor: preset.surface,
      textColor: preset.text, accentColor: preset.accent, glowColor: preset.glow,
    }));
  };

  const storeTemplates = useMemo(() => getTemplates(storeType as any), [storeType]);

  const orderedProducts = useMemo(() => catalog.filter(p => p.isActive !== false), [catalog]);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--admin-gold)' }} />
    </div>
  );

  const tools: { key: Tool; label: string; icon: any }[] = [
    { key: 'themes', label: 'Thèmes', icon: Palette },
    { key: 'text', label: 'Texte', icon: Type },
    { key: 'image', label: 'Image', icon: Image },
    { key: 'color', label: 'Couleur', icon: PaintBucket },
    { key: 'font', label: 'Police', icon: Globe },
    { key: 'products', label: 'Produits', icon: Package },
    { key: 'categories', label: 'Catégories', icon: Layers },
  ];

  return (
    <div className={`flex flex-col ${fullScreen ? 'h-screen' : 'h-[calc(100vh-3.5rem)] -m-4 md:-m-6'}`} style={{ background: 'var(--admin-bg)' }}>
      <div className="flex items-center gap-1 px-3 py-1.5 flex-shrink-0 overflow-x-auto" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border2)' }}>
        {tools.map(t => (
          <button key={t.key} onClick={() => { setActiveTool(t.key); setPanelOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap"
            style={{
              background: activeTool === t.key && panelOpen ? 'var(--admin-gold-bg)' : 'transparent',
              color: activeTool === t.key && panelOpen ? 'var(--admin-gold)' : 'var(--admin-muted)',
            }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={loadAll} className="p-1.5 rounded-lg" style={{ color: 'var(--admin-muted)' }} title="Actualiser">
          <RefreshCw size={14} />
        </button>
        <button onClick={saveSettings} className="gold-btn px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
          <Save size={12} /> Sauvegarder
        </button>
        <button onClick={() => setPanelOpen(!panelOpen)} className="p-1.5 rounded-lg ml-1" style={{ color: panelOpen ? 'var(--admin-gold)' : 'var(--admin-muted2)' }}>
          {panelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative" style={{ background: '#f0f0f0' }}>
          {blobUrl ? (
            <iframe ref={iframeRef} src={blobUrl}
              className="absolute inset-0 w-full h-full border-0"
              title="Storefront Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--admin-muted2)' }}>
              Aucun template disponible pour ce type de boutique
            </div>
          )}
        </div>

        {panelOpen && (
          <div className="w-80 flex-shrink-0 overflow-y-auto" style={{ background: 'var(--admin-surface)', borderLeft: '1px solid var(--admin-border2)' }}>
            <div className="p-4 space-y-4">
              {activeTool === 'themes' && (
                <div>
                  <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: 'var(--admin-gold)' }}>THÈMES</p>
                  <div className="space-y-1.5 mb-4">
                    {storeTemplates.map(t => (
                      <button key={t.id} onClick={() => selectTemplate(t)}
                        className="w-full text-left p-3 rounded-xl transition-all"
                        style={{
                          background: template?.id === t.id ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)',
                          outline: template?.id === t.id ? '2px solid var(--admin-gold)' : '2px solid transparent',
                        }}>
                        <p className="text-xs font-bold" style={{ color: template?.id === t.id ? 'var(--admin-gold)' : 'var(--admin-muted)' }}>{t.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-muted2)' }}>{t.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'text' && (
                <div>
                  <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: 'var(--admin-gold)' }}>TEXTE</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Nom de la boutique</label>
                      <input value={settings.storeName} onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Titre hero</label>
                      <input value={settings.bannerText} onChange={e => setSettings(s => ({ ...s, bannerText: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Tagline</label>
                      <textarea value={settings.tagline} onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))} rows={3}
                        className="w-full px-3 py-2 rounded-lg text-xs resize-none" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'image' && (
                <div>
                  <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: 'var(--admin-gold)' }}>IMAGE</p>
                  <div>
                    <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Image hero (URL)</label>
                    <input value={settings.heroImage} onChange={e => setSettings(s => ({ ...s, heroImage: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
                  </div>
                </div>
              )}

              {activeTool === 'color' && (
                <div>
                  <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: 'var(--admin-gold)' }}>COULEUR</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {([
                      { key: 'bgColor', label: 'Fond' },
                      { key: 'surfaceColor', label: 'Surface' },
                      { key: 'textColor', label: 'Texte' },
                      { key: 'accentColor', label: 'Accent' },
                    ] as const).map(f => (
                      <div key={f.key}>
                        <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>{f.label}</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={settings[f.key]} onChange={e => handleColorChange(f.key, e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                          <input value={settings[f.key]} onChange={e => handleColorChange(f.key, e.target.value)}
                            className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-mono" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold tracking-wide mb-2" style={{ color: 'var(--admin-muted)' }}>PRÉRÉGLAGES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map(p => (
                      <button key={p.name} onClick={() => applyPreset(p)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
                        style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted)' }}>
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.accent }} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'font' && (
                <div>
                  <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: 'var(--admin-gold)' }}>POLICE</p>
                  <div className="space-y-1">
                    {FONTS.map(f => (
                      <button key={f.value} onClick={() => setSettings(s => ({ ...s, fontFamily: f.value }))}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all"
                        style={{
                          background: settings.fontFamily === f.value ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)',
                          color: settings.fontFamily === f.value ? 'var(--admin-gold)' : 'var(--admin-muted)',
                          fontFamily: f.value,
                        }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'products' && (
                <div>
                  <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: 'var(--admin-gold)' }}>PRODUITS ({orderedProducts.length})</p>
                  <div className="space-y-1.5">
                    {orderedProducts.slice(0, 20).map(p => (
                      <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--admin-surface2)' }}>
                        {p.imageUrl
                          ? <img src={p.imageUrl} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px]" style={{ background: 'var(--admin-bg)', color: 'var(--admin-muted2)' }}>img</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold truncate">{p.name}</p>
                          <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>{p.salePrice}€ {p.promoPrice ? <span style={{ color: 'var(--admin-gold)' }}>→ {p.promoPrice}€</span> : ''}</p>
                        </div>
                      </div>
                    ))}
                    {orderedProducts.length > 20 && (
                      <p className="text-[10px] text-center" style={{ color: 'var(--admin-muted2)' }}>+{orderedProducts.length - 20} autres</p>
                    )}
                  </div>
                </div>
              )}

              {activeTool === 'categories' && (
                <div>
                  <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: 'var(--admin-gold)' }}>CATÉGORIES ({categories.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(c => (
                      <div key={c.id} className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted)' }}>
                        {c.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
