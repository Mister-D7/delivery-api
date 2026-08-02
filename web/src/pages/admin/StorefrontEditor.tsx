import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Save, Palette,
  Package, Layers, PanelRightClose, PanelRightOpen,
  RefreshCw, Loader2, Plus, Pencil, Trash2, Pin, PinOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { RawCatalog, CatalogProduct, Category, ThemeSettings } from './editorTypes';
import { THEME_DEFAULTS } from './editorTypes';
import {
  getThemePages, getActiveTheme, getStoreType, storeTypeLabel,
  selectTheme,
  loadSavedSettings, saveSettingsForTheme, deleteCustomTheme,
  type ThemePage, type StoreType,
} from '../../themes';
import ProductForm from './ProductForm';
import CategoryForm from './CategoryForm';

type Tool = 'themes' | 'products' | 'categories' | null;

export default function StorefrontEditor({ fullScreen }: { fullScreen?: boolean }) {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<ThemeSettings>(THEME_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<Tool>('themes');
  const [panelOpen, setPanelOpen] = useState(true);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('delivery_pinned_products');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    try { localStorage.setItem('delivery_pinned_products', JSON.stringify(pinned)); } catch {}
  }, [pinned]);

  const storeType = useMemo(() => getStoreType(), []);

  const template = useMemo<ThemePage | undefined>(() => getActiveTheme(storeType as StoreType), [storeType]);

  useEffect(() => {
    if (!template) return;
    const saved = loadSavedSettings(template.id);
    setSettings({
      ...THEME_DEFAULTS,
      bgColor: template.defaults.bg,
      surfaceColor: template.defaults.surface,
      textColor: template.defaults.ink,
      accentColor: template.defaults.accent,
      fontFamily: template.defaults.font,
      ...saved,
    });
    (async () => {
      try {
        const r = await api.get('/storefront/settings/storefront');
        if (r.data && typeof r.data === 'object') setSettings(s => ({ ...s, ...r.data }));
      } catch {}
    })();
  }, [template]);

  const buildBlob = useCallback(() => ({
    storeName: settings.storeName,
    bannerText: settings.bannerText,
    tagline: settings.tagline,
    heroImage: settings.heroImage,
    bgColor: settings.bgColor,
    surfaceColor: settings.surfaceColor,
    textColor: settings.textColor,
    accentColor: settings.accentColor,
    fontFamily: settings.fontFamily,
    pinned,
    theme: template?.id,
  }), [settings, pinned, template]);

  useEffect(() => {
    if (!template) return;
    const t = setTimeout(() => {
      api.put('/storefront/settings/storefront', { value: buildBlob() }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [template, buildBlob]);

  useEffect(() => {
    if (!template) return;
    const t = setTimeout(() => setPreviewKey(k => k + 1), 500);
    return () => clearTimeout(t);
  }, [template, pinned]);

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
            description: raw.description ?? p?.description ?? null,
            storeType: raw.storeType || 'general',
          };
        }))),
        api.get('/categories', { params: { storeType } }).then(r => setCategories((r.data || []).map((c: any): Category => ({
          id: c.id, name: c.name, imageUrl: c.image_url || c.imageUrl || null, storeType: c.storeType || 'general',
        })))),
      ]);
    } catch {}
    setLoading(false);
  }, [storeType]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const orderedProducts = useMemo(() => catalog.filter(p => p.isActive !== false), [catalog]);

  const togglePin = (id: string) => {
    setPinned(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDropOnPreview = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) togglePin(id);
    setDragId(null);
  };

  const openProductEditor = useCallback((p: CatalogProduct) => {
    setEditingProduct(p);
    setProductFormOpen(true);
  }, []);

  const selectTemplate = (t: ThemePage) => {
    selectTheme(t.id);
    window.location.reload();
  };

  const handleDeleteTheme = (t: ThemePage) => {
    if (!window.confirm(`Supprimer le thème « ${t.name} » ?`)) return;
    deleteCustomTheme(t.id);
    if (template?.id === t.id) selectTheme('');
    window.location.reload();
  };

  const handleDeleteProduct = async (p: CatalogProduct) => {
    if (!window.confirm(`Supprimer « ${p.name} » ?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success('Produit supprimé');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleDeleteCategory = async (c: Category) => {
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ?`)) return;
    try {
      await api.delete(`/categories/${c.id}`);
      toast.success('Catégorie supprimée');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const saveSettings = async () => {
    if (!template) return;
    try {
      saveSettingsForTheme(template.id, settings);
      await api.put('/storefront/settings/storefront', { value: buildBlob() });
      toast.success('Sauvegardé !');
      setPreviewKey(k => k + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const storeTemplates = useMemo(() => getThemePages(storeType as StoreType), [storeType]);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--admin-gold)' }} />
    </div>
  );

  const tools: { key: Tool; label: string; icon: any }[] = [
    { key: 'themes', label: 'Thèmes', icon: Palette },
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
        <div className="flex-1 relative overflow-hidden" style={{ background: '#fff' }}>
          {template ? (
            <>
              <iframe
                key={previewKey}
                src={(import.meta as any).env?.DEV ? 'http://localhost:4000/' : '/'}
                className="w-full h-full block"
                title="Aperçu boutique en direct"
                style={{ border: 'none', background: '#fff' }}
              />
              {dragId && (
                <div
                  className="fixed inset-0 flex items-center justify-center z-50"
                  style={{ background: 'rgba(20,20,20,0.35)', border: '3px dashed var(--admin-gold)' }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDropOnPreview}
                >
                  <div className="px-5 py-3 rounded-xl text-sm font-bold" style={{ background: 'var(--admin-surface)', color: 'var(--admin-gold)' }}>
                    Déposer pour épingler sur la page
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--admin-muted2)' }}>
              Aucun thème disponible pour ce type de boutique
            </div>
          )}
        </div>

        {panelOpen && (
          <div className="w-80 flex-shrink-0 overflow-y-auto" style={{ background: 'var(--admin-surface)', borderLeft: '1px solid var(--admin-border2)' }}>
            <div className="p-4 space-y-4">
              {activeTool === 'themes' && (
                <div>
                  <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: 'var(--admin-gold)' }}>THÈMES</p>
                  <div className="space-y-1">
                    {storeTemplates.map(t => (
                      <div key={t.id} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all"
                        style={{
                          background: template?.id === t.id ? 'var(--admin-gold-bg)' : 'transparent',
                          outline: template?.id === t.id ? '1px solid var(--admin-gold)' : '1px solid transparent',
                          outlineOffset: '-1px',
                        }}
                        onClick={() => selectTemplate(t)}>
                        <span className="w-10 h-6 rounded-md flex-shrink-0 overflow-hidden"
                          style={{ background: t.defaults.bg, border: '1px solid rgba(255,255,255,0.14)' }}>
                          <span className="block h-1.5 w-full" style={{ background: t.defaults.accent }} />
                        </span>
                        <p className="text-xs font-semibold flex-1 truncate"
                          style={{ color: template?.id === t.id ? 'var(--admin-gold)' : 'var(--admin-muted)' }}>{t.name}</p>
                        {t.id.startsWith('custom-') && (
                          <button onClick={e => { e.stopPropagation(); handleDeleteTheme(t); }}
                            className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
                            title="Supprimer ce thème importé">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'products' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold tracking-wide" style={{ color: 'var(--admin-gold)' }}>
                      PRODUITS ({orderedProducts.length}){pinned.length > 0 && !showAllProducts ? ` · épinglés ${pinned.length}` : ''}
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowAllProducts(!showAllProducts)}
                        className="px-2 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: showAllProducts ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)', color: showAllProducts ? 'var(--admin-gold)' : 'var(--admin-muted)' }}
                        title={showAllProducts ? 'Produits épinglés en premier' : 'Ordre normal (sans épinglage)'}>
                        {showAllProducts ? 'Normal' : 'Épinglés en 1er'}
                      </button>
                      <button onClick={() => { setEditingProduct(null); setProductFormOpen(true); }}
                        className="gold-btn px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                        <Plus size={12} /> Ajouter
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] mb-2" style={{ color: 'var(--admin-muted2)' }}>
                    Glissez un produit et déposez-le sur l'aperçu pour l'épingler sur la page. Glissez sur un autre produit pour le réordonner.
                  </p>
                  <div className="space-y-1.5">
                    {orderedProducts.slice(0, 50).map(p => {
                      const isPinned = pinned.includes(String(p.id));
                      const isDrag = dragId === String(p.id);
                      return (
                        <div key={p.id}
                          draggable
                          onDragStart={e => { e.dataTransfer.setData('text/plain', String(p.id)); setDragId(String(p.id)); }}
                          onDragEnd={() => setDragId(null)}
                          onDragOver={e => { e.preventDefault(); }}
                          onDrop={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            const srcId = e.dataTransfer.getData('text/plain');
                            if (!srcId || srcId === String(p.id)) { setDragId(null); return; }
                            setPinned(prev => {
                              const next = prev.filter(x => x !== srcId);
                              const idx = next.indexOf(String(p.id));
                              const insertAt = idx === -1 ? next.length : idx;
                              next.splice(insertAt, 0, srcId);
                              return next;
                            });
                            setDragId(null);
                          }}
                          className="group flex items-center gap-2 p-2 rounded-lg cursor-grab transition-colors"
                          style={{ background: isPinned ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)', opacity: isDrag ? 0.5 : 1, border: `1px solid ${isPinned ? 'var(--admin-gold)' : 'transparent'}` }}
                          onClick={() => { setEditingProduct(p); setProductFormOpen(true); }}>
                          <Pin size={12} style={{ color: isPinned ? 'var(--admin-gold)' : 'var(--admin-muted2)', flexShrink: 0 }} />
                          {p.imageUrl
                            ? <img src={p.imageUrl} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                            : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px]" style={{ background: 'var(--admin-bg)', color: 'var(--admin-muted2)' }}>img</div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold truncate">{p.name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>{p.salePrice.toLocaleString()} DA {p.promoPrice ? <span style={{ color: 'var(--admin-gold)' }}>→ {p.promoPrice.toLocaleString()} DA</span> : ''}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={e => { e.stopPropagation(); togglePin(String(p.id)); }}
                              className="p-1.5 rounded-md" style={{ color: isPinned ? 'var(--admin-gold)' : 'var(--admin-muted)' }} title={isPinned ? 'Désépingler' : 'Épingler'}>
                              {isPinned ? <Pin size={12} /> : <PinOff size={12} />}
                            </button>
                            <button onClick={e => { e.stopPropagation(); setEditingProduct(p); setProductFormOpen(true); }}
                              className="p-1.5 rounded-md" style={{ color: 'var(--admin-muted)' }} title="Modifier">
                              <Pencil size={12} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDeleteProduct(p); }}
                              className="p-1.5 rounded-md" style={{ color: '#ef4444' }} title="Supprimer">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {orderedProducts.length > 50 && (
                      <p className="text-[10px] text-center" style={{ color: 'var(--admin-muted2)' }}>+{orderedProducts.length - 50} autres</p>
                    )}
                  </div>
                </div>
              )}

              {activeTool === 'categories' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold tracking-wide" style={{ color: 'var(--admin-gold)' }}>CATÉGORIES ({categories.length})</p>
                    <button onClick={() => { setEditingCategory(null); setCategoryFormOpen(true); }}
                      className="gold-btn px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <Plus size={12} /> Ajouter
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {categories.map(c => (
                      <div key={c.id} className="group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors" style={{ background: 'var(--admin-surface2)' }}
                        onClick={() => { setEditingCategory(c); setCategoryFormOpen(true); }}>
                        {c.imageUrl
                          ? <img src={c.imageUrl} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px]" style={{ background: 'var(--admin-bg)', color: 'var(--admin-muted2)' }}>cat</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold truncate">{c.name}</p>
                          <p className="text-[9px]" style={{ color: 'var(--admin-muted2)' }}>{storeTypeLabel(c.storeType || 'general')}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); setEditingCategory(c); setCategoryFormOpen(true); }}
                            className="p-1.5 rounded-md" style={{ color: 'var(--admin-muted)' }} title="Modifier">
                            <Pencil size={12} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDeleteCategory(c); }}
                            className="p-1.5 rounded-md" style={{ color: '#ef4444' }} title="Supprimer">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {productFormOpen && (
        <ProductForm
          categories={categories}
          initial={editingProduct || undefined}
          onClose={() => setProductFormOpen(false)}
          onSaved={loadAll}
        />
      )}
      {categoryFormOpen && (
        <CategoryForm
          initial={editingCategory || undefined}
          storeType={storeType}
          onClose={() => setCategoryFormOpen(false)}
          onSaved={loadAll}
        />
      )}
    </div>
  );
}
