import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Save, Palette,
  Package, Layers, PanelRightClose, PanelRightOpen,
  RefreshCw, Loader2, Plus, Pencil, Trash2, Pin, PinOff, Search, Gift,
  Star, Upload, ChevronUp, ChevronDown, Clock,
} from '../../components/adminIcons';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { RawCatalog, CatalogProduct, Category, ThemeSettings } from './editorTypes';
import { THEME_DEFAULTS } from './editorTypes';
import {
  getThemePages, getActiveTheme, getStoreType, storeTypeLabel, storeTypeForTheme,
  selectTheme,
  loadSavedSettings, saveSettingsForTheme, deleteCustomTheme,
  type ThemePage, type StoreType,
} from '../../themes';
import ProductForm from './ProductForm';
import CategoryForm from './CategoryForm';
import AdminSelect from './AdminSelect';

type Tool = 'themes' | 'products' | 'categories' | 'combos' | 'specialCats' | 'preorder' | null;

type Slide = {
  id: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  align?: 'left' | 'center' | 'right';
};

type ComboProduct = { productId: string; name?: string; price?: number; imageUrl?: string | null; qty: number };
type ComboRow = {
  id: string; name: string; description?: string | null; price: number;
  imageUrl?: string | null; isActive: boolean; products: ComboProduct[];
  totalValue?: number; savings?: number;
};

type SpecialCat = {
  id: string;
  name: string;
  imageUrl?: string | null;
  sections: string[];
  products: string[];
};

function comboPriceOf(p: CatalogProduct): number {
  return Number(p.promoPrice ?? p.salePrice ?? 0);
}

function rawToCatalogProduct(p: any): CatalogProduct {
  return {
    id: p.id, name: p.name || 'Produit', salePrice: Number(p.sale_price ?? p.salePrice ?? 0),
    imageUrl: p.image_url || p.imageUrl || null, modelUrl: p.modelUrl || null,
    stockQty: Number(p.stock_qty ?? p.stockQty ?? 0), category: null, barcode: p.barcode || null,
    displayOrder: 0, isActive: true, promoPrice: p.promo_price ?? p.promoPrice ?? null,
    costPrice: p.cost_price ?? p.costPrice ?? null, customName: p.custom_name || null,
    customPrice: p.custom_price ?? null, customDescription: p.custom_description || null,
    productId: p.product_id || null, specs: p.specs || null, description: p.description || null,
    storeType: 'tech',
  };
}

function isVedetteName(name?: string | null) {
  return String(name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'vedette';
}

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
  const [combos, setCombos] = useState<ComboRow[]>([]);
  const [comboFormOpen, setComboFormOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboRow | null>(null);
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('delivery_pinned_products');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [slideDraft, setSlideDraft] = useState<Slide | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [dragSlideId, setDragSlideId] = useState<string | null>(null);
  const [specialCats, setSpecialCats] = useState<SpecialCat[]>([]);

  useEffect(() => {
    try { localStorage.setItem('delivery_pinned_products', JSON.stringify(pinned)); } catch {}
  }, [pinned]);

  const [storeType, setStoreType] = useState<StoreType>(() => getStoreType());

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/storefront/settings/storefront');
        if (r.data && typeof r.data === 'object' && r.data.theme) {
          setStoreType(storeTypeForTheme(r.data.theme));
        }
      } catch {}
    })();
  }, []);

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
        if (r.data && typeof r.data === 'object') {
          setSettings(s => ({ ...s, ...r.data }));
          const sl = Array.isArray((r.data as any).slides) ? (r.data as any).slides as Slide[] : [];
          setSlides(sl);
          const sc = Array.isArray((r.data as any).specialCategories) ? (r.data as any).specialCategories as SpecialCat[] : [];
          setSpecialCats(sc);
        }
      } catch {}
    })();
  }, [template]);

  const buildBlob = useCallback(() => ({
    storeName: settings.storeName,
    tagline: settings.tagline,
    heroImage: settings.heroImage,
    bgColor: settings.bgColor,
    surfaceColor: settings.surfaceColor,
    textColor: settings.textColor,
    accentColor: settings.accentColor,
    fontFamily: settings.fontFamily,
    pinned,
    theme: template?.id,
    model3d: settings.model3d,
    preorderStart: settings.preorderStart,
    preorderWindowDays: settings.preorderWindowDays,
    preorderPrice: settings.preorderPrice,
    preorderStrike: settings.preorderStrike,
  }), [settings, pinned, template]);

  const saveBlobMerged = useCallback(async () => {
    try {
      const r = await api.get('/storefront/settings/storefront');
      const existing = (r.data && typeof r.data === 'object') ? r.data : {};
      await api.put('/storefront/settings/storefront', { value: { ...existing, ...buildBlob() } });
    } catch {}
  }, [buildBlob]);

  useEffect(() => {
    if (!template) return;
    const t = setTimeout(() => {
      void saveBlobMerged();
    }, 600);
    return () => clearTimeout(t);
  }, [template, buildBlob, saveBlobMerged]);

  useEffect(() => {
    if (!template) return;
    const t = setTimeout(() => setPreviewKey(k => k + 1), 500);
    return () => clearTimeout(t);
  }, [template, pinned]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        api.get('/catalog/admin', { params: { storeType } }).then(r => setCatalog((r.data || []).map((raw: RawCatalog): CatalogProduct => {
          const p = raw.product;
          return {
            id: raw.id, name: raw.name || p?.name || 'Produit',
            salePrice: raw.salePrice ?? p?.salePrice ?? 0,
            imageUrl: raw.imageUrl || p?.imageUrl || null,
            modelUrl: raw.modelUrl || null,
            stockQty: raw.stockQty ?? p?.stockQty ?? 0,
            category: raw.category || null,
            barcode: raw.barcode || p?.barcode || null,
            displayOrder: raw.displayOrder, isActive: raw.isActive,
            promoPrice: raw.promoPrice ?? null, costPrice: raw.costPrice ?? null,
            customName: raw.customName || null, customPrice: raw.customPrice ?? null,
            customDescription: raw.customDescription || null,
            productId: raw.productId || null, specs: raw.specs || null,
            description: raw.description ?? p?.description ?? null,
            storeType: raw.storeType || 'tech',
          };
        }))),
        api.get('/categories', { params: { storeType } }).then(r => setCategories((r.data || []).map((c: any): Category => ({
          id: c.id, name: c.name, imageUrl: c.image_url || c.imageUrl || null, storeType: c.storeType || 'tech',
        })))),
        api.get('/combos').then(r => setCombos(r.data?.combos || [])),
      ]);
    } catch {}
    setLoading(false);
  }, [storeType]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const orderedProducts = useMemo(() => catalog.filter(p => p.isActive !== false), [catalog]);

  const visibleProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return orderedProducts.filter(p => {
      const matchCat = !catFilter
        || (p.category && (String(p.category.id) === String(catFilter) || p.category.name === catFilter));
      if (!matchCat) return false;
      if (!q) return true;
      const hay = [p.name, p.specs, p.description, p.barcode, p.category?.name].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [orderedProducts, catFilter, productSearch]);

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
    if (isVedetteName(c.name)) {
      toast.error('La catégorie Vedette est protégée et ne peut pas être supprimée.');
      return;
    }
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ?`)) return;
    try {
      await api.delete(`/categories/${c.id}`);
      toast.success('Catégorie supprimée');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleToggleCombo = async (c: ComboRow) => {
    try {
      await api.post(`/combos/${c.id}/toggle`);
      toast.success(c.isActive ? 'Combo désactivé' : 'Combo activé');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteCombo = async (c: ComboRow) => {
    if (!window.confirm(`Supprimer le combo « ${c.name} » ?`)) return;
    try {
      await api.delete(`/combos/${c.id}`);
      toast.success('Combo supprimé');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const saveSettings = async () => {
    if (!template) return;
    try {
      saveSettingsForTheme(template.id, settings);
      await saveBlobMerged();
      toast.success('Sauvegardé !');
      setPreviewKey(k => k + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const saveSlides = async (list: Slide[]) => {
    try {
      const r = await api.get('/storefront/settings/storefront');
      const existing = (r.data && typeof r.data === 'object') ? r.data : {};
      await api.put('/storefront/settings/storefront', { value: { ...existing, slides: list } });
    } catch {}
  };

  const startNewSlide = () => {
    setEditingSlideId(null);
    setSlideDraft({ id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: '', badge: '', subtitle: '', ctaLabel: '', ctaUrl: '', imageUrl: '', align: 'left' });
  };

  const saveSlideDraft = async () => {
    if (!slideDraft) return;
    const draft: Slide = {
      id: slideDraft.id,
      title: slideDraft.title?.trim() || undefined,
      badge: slideDraft.badge?.trim() || undefined,
      subtitle: slideDraft.subtitle?.trim() || undefined,
      ctaLabel: slideDraft.ctaLabel?.trim() || undefined,
      ctaUrl: slideDraft.ctaUrl?.trim() || undefined,
      imageUrl: slideDraft.imageUrl?.trim() || undefined,
      align: slideDraft.align || 'left',
    };
    const next = editingSlideId
      ? slides.map(s => (s.id === editingSlideId ? draft : s))
      : [...slides, draft];
    setSlides(next);
    setSlideDraft(null);
    setEditingSlideId(null);
    try {
      await saveSlides(next);
      toast.success('Slider mis à jour');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur de sauvegarde');
    }
  };

  const uploadSlideImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await api.post('/upload/image', fd);
      const url = (r.data as any)?.url || (r.data as any)?.imageUrl || '';
      if (url) setSlideDraft(d => (d ? { ...d, imageUrl: url } : d));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de l’upload');
    }
  };

  const handleDeleteSlide = async (s: Slide) => {
    if (!window.confirm(`Supprimer la diapositive « ${s.title || s.badge || 'sans titre'} » ?`)) return;
    const next = slides.filter(x => x.id !== s.id);
    setSlides(next);
    if (editingSlideId === s.id) { setSlideDraft(null); setEditingSlideId(null); }
    try {
      await saveSlides(next);
      toast.success('Diapositive supprimée');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur de suppression');
    }
  };

  const reorderSlides = (srcId: string, targetId: string) => {
    setSlides(prev => {
      const next = prev.filter(x => x.id !== srcId);
      const idx = next.findIndex(x => x.id === targetId);
      const insertAt = idx === -1 ? next.length : idx;
      const src = prev.find(x => x.id === srcId);
      if (src) next.splice(insertAt, 0, src);
      return next;
    });
    setDragSlideId(null);
    void (async () => {
      const next = slides.filter(x => x.id !== srcId);
      const idx = next.findIndex(x => x.id === targetId);
      const insertAt = idx === -1 ? next.length : idx;
      const src = slides.find(x => x.id === srcId);
      if (src) next.splice(insertAt, 0, src);
      await saveSlides(next);
    })();
  };

  const saveSpecialCatsBlob = async (next: SpecialCat[]) => {
    try {
      const r = await api.get('/storefront/settings/storefront');
      const existing = (r.data && typeof r.data === 'object') ? r.data : {};
      await api.put('/storefront/settings/storefront', { value: { ...existing, specialCategories: next } });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const specialCatPatch = (id: string, patch: Partial<SpecialCat>) => {
    setSpecialCats(prev => {
      const next = prev.map(c => (c.id === id ? { ...c, ...patch } : c));
      void saveSpecialCatsBlob(next);
      return next;
    });
  };

  const specialCatAdd = () => {
    const id = 'sc' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setSpecialCats(prev => {
      const next = [...prev, { id, name: 'Nouvelle catégorie spéciale', imageUrl: '', sections: [], products: [] }];
      void saveSpecialCatsBlob(next);
      return next;
    });
    toast.success('Catégorie spéciale créée');
  };

  const specialCatDelete = (c: SpecialCat) => {
    if (!window.confirm(`Supprimer la catégorie spéciale « ${c.name} » ?`)) return;
    setSpecialCats(prev => {
      const next = prev.filter(x => x.id !== c.id);
      void saveSpecialCatsBlob(next);
      return next;
    });
    toast.success('Catégorie spéciale supprimée');
  };

  const specialCatMove = (i: number, dir: number) => {
    setSpecialCats(prev => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      void saveSpecialCatsBlob(next);
      return next;
    });
  };

  const specialCatAddProduct = (c: SpecialCat, productId: string) => {
    if (!productId || c.products.includes(productId)) return;
    setSpecialCats(prev => {
      const next = prev.map(x => (x.id === c.id ? { ...x, products: [...x.products, productId] } : x));
      void saveSpecialCatsBlob(next);
      return next;
    });
  };

  const specialCatRemoveProduct = (c: SpecialCat, productId: string) => {
    setSpecialCats(prev => {
      const next = prev.map(x => (x.id === c.id ? { ...x, products: x.products.filter(pid => pid !== productId) } : x));
      void saveSpecialCatsBlob(next);
      return next;
    });
  };

  const storeTemplates = useMemo(() => getThemePages(), []);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--admin-gold)' }} />
    </div>
  );

  const tools: { key: Tool; label: string; icon: any }[] = [
    { key: 'themes', label: 'Thèmes', icon: Palette },
    { key: 'products', label: 'Produits', icon: Package },
    { key: 'categories', label: 'Catégories', icon: Layers },
    { key: 'combos', label: 'Combos', icon: Gift },
    { key: 'specialCats', label: '⭐ Catégories spéciales', icon: Star },
    { key: 'preorder', label: 'Précommande', icon: Clock },
  ];

  return (
    <div className={`flex flex-col ${fullScreen ? 'h-screen' : 'h-[calc(100vh-3.5rem)] -m-4 md:-m-6'}`} style={{ background: 'var(--admin-bg)' }}>
      <div className="flex items-center gap-1 px-3 py-1.5 flex-shrink-0 overflow-x-auto" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border2)' }}>
        {tools.map(t => (
          <button key={t.key} onClick={() => { setActiveTool(t.key); setPanelOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap"
            style={{
              background: activeTool === t.key && panelOpen ? 'var(--admin-surface2)' : 'transparent',
              color: activeTool === t.key && panelOpen ? 'var(--admin-text)' : 'var(--admin-muted)',
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
                src={(import.meta as any).env?.DEV ? 'http://localhost:4000/?edit=1' : '/?edit=1'}
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
                      PRODUITS {catFilter || productSearch.trim() ? `(${visibleProducts.length}/${orderedProducts.length})` : `(${orderedProducts.length})`}{pinned.length > 0 && !showAllProducts ? ` · épinglés ${pinned.length}` : ''}
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
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border2)' }}>
                      <Search size={12} style={{ color: 'var(--admin-muted2)', flexShrink: 0 }} />
                      <input
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Rechercher un produit…"
                        className="w-full min-w-0 bg-transparent text-[11px] outline-none"
                        style={{ color: 'var(--admin-text)' }}
                      />
                      {productSearch && (
                        <button onClick={() => setProductSearch('')} className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>✕</button>
                      )}
                    </div>
                    <AdminSelect
                      value={catFilter || ''}
                      onChange={v => setCatFilter(v || null)}
                      title="Filtrer par catégorie"
                      className="px-1.5 py-1.5 rounded-lg text-[10px] outline-none"
                      options={[{ value: '', label: 'Toutes les catégories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    {visibleProducts.map(p => {
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
                            <p className="text-[11px] font-semibold truncate">
                              {p.name}{' '}
                              {!p.costPrice && (
                                <span className="ml-1 text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', verticalAlign: 'middle' }}>
                                  COÛT MANQUANT
                                </span>
                              )}
                            </p>
                            <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>{p.costPrice ? `Achat ${p.costPrice.toLocaleString()} DA · ` : ''}{p.salePrice.toLocaleString()} DA {p.promoPrice ? <span style={{ color: 'var(--admin-gold)' }}>→ {p.promoPrice.toLocaleString()} DA</span> : ''}</p>
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
                    {visibleProducts.length === 0 && (
                      <p className="text-[10px] text-center py-3" style={{ color: 'var(--admin-muted2)' }}>Aucun produit ne correspond à ce filtre.</p>
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
                      <div key={c.id} className="group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors" style={{ background: isVedetteName(c.name) ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)' }}
                        onClick={() => { setEditingCategory(c); setCategoryFormOpen(true); }}>
                        {c.imageUrl
                          ? <img src={c.imageUrl} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px]" style={{ background: 'var(--admin-bg)', color: 'var(--admin-muted2)' }}>cat</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold truncate">{c.name}{isVedetteName(c.name) ? ' 🔒' : ''}</p>
                          <p className="text-[9px]" style={{ color: 'var(--admin-muted2)' }}>{storeTypeLabel(c.storeType || 'tech')} · toujours en premier</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); setEditingCategory(c); setCategoryFormOpen(true); }}
                            className="p-1.5 rounded-md" style={{ color: 'var(--admin-muted)' }} title="Modifier">
                            <Pencil size={12} />
                          </button>
                          {!isVedetteName(c.name) && (
                            <button onClick={e => { e.stopPropagation(); handleDeleteCategory(c); }}
                              className="p-1.5 rounded-md" style={{ color: '#ef4444' }} title="Supprimer">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'combos' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold tracking-wide" style={{ color: 'var(--admin-gold)' }}>
                      COMBOS ({combos.length})
                    </p>
                    <button onClick={() => { setEditingCombo(null); setComboFormOpen(true); }}
                      className="gold-btn px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <Plus size={12} /> Nouveau
                    </button>
                  </div>
                  <p className="text-[10px] mb-2" style={{ color: 'var(--admin-muted2)' }}>
                    Composez un pack de plusieurs produits et fixez son prix promo. Il s'affichera dans la section « Offres combinées » de la boutique.
                  </p>
                  <div className="space-y-1.5">
                    {combos.map(c => (
                      <div key={c.id} className="group flex items-center gap-2 p-2 rounded-lg transition-colors"
                        style={{ background: 'var(--admin-surface2)', border: `1px solid ${c.isActive ? 'transparent' : 'var(--admin-border2)'}` }}>
                        {c.imageUrl
                          ? <img src={c.imageUrl} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px]" style={{ background: 'var(--admin-bg)', color: 'var(--admin-muted2)' }}>combo</div>
                        }
                        <div className="flex-1 min-w-0" style={{ cursor: 'pointer' }} onClick={() => { setEditingCombo(c); setComboFormOpen(true); }}>
                          <p className="text-[11px] font-semibold truncate">
                            {c.name}
                            {!c.isActive && <span className="ml-1 text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', verticalAlign: 'middle' }}>INACTIF</span>}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>
                            {c.products.length} produit{c.products.length > 1 ? 's' : ''} · {typeof c.totalValue === 'number' ? `${c.totalValue.toLocaleString()} DA ` : ''}
                            <span style={{ color: 'var(--admin-gold)' }}>→ {c.price.toLocaleString()} DA</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); handleToggleCombo(c); }}
                            className="p-1.5 rounded-md" title={c.isActive ? 'Désactiver' : 'Activer'}
                            style={{ color: c.isActive ? 'var(--admin-gold)' : 'var(--admin-muted)' }}>
                            {c.isActive ? '●' : '○'}
                          </button>
                          <button onClick={e => { e.stopPropagation(); setEditingCombo(c); setComboFormOpen(true); }}
                            className="p-1.5 rounded-md" style={{ color: 'var(--admin-muted)' }} title="Modifier">
                            <Pencil size={12} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDeleteCombo(c); }}
                            className="p-1.5 rounded-md" style={{ color: '#ef4444' }} title="Supprimer">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {combos.length === 0 && (
                      <p className="text-[10px] text-center py-3" style={{ color: 'var(--admin-muted2)' }}>Aucun combo. Cliquez sur « Nouveau » pour en créer un.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTool === 'specialCats' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold tracking-wide" style={{ color: 'var(--admin-gold)' }}>
                      CATÉGORIES SPÉCIALES ({specialCats.length}) · {specialCats.reduce((n, c) => n + c.products.length, 0)} produit{specialCats.reduce((n, c) => n + c.products.length, 0) > 1 ? 's' : ''}
                    </p>
                    <button onClick={specialCatAdd}
                      className="gold-btn px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <Plus size={12} /> Nouvelle
                    </button>
                  </div>
                  <p className="text-[10px] mb-2" style={{ color: 'var(--admin-muted2)' }}>
                    Les catégories spéciales regroupent les éléments « ⭐ » de la boutique : leurs propres produits, les sliders et les images.
                    Pour y ajouter un élément : clic droit dessus dans l'aperçu → « ⭐ Assigner à une catégorie spéciale ». Les produits peuvent aussi être ajoutés ici.
                  </p>
                  <div className="space-y-2">
                    {specialCats.length === 0 && (
                      <p className="text-[10px] text-center py-3" style={{ color: 'var(--admin-muted2)' }}>
                        Aucune catégorie spéciale. Créez-en une, puis faites un clic droit sur un slider, une image ou un produit dans l'aperçu pour l'y assigner.
                      </p>
                    )}
                    {specialCats.map((c, i) => {
                      const assigned = c.products
                        .map(pid => orderedProducts.find(p => String(p.id) === String(pid)))
                        .filter((p): p is CatalogProduct => Boolean(p));
                      const missing = c.products.filter(pid => !orderedProducts.some(p => String(p.id) === String(pid)));
                      const available = orderedProducts.filter(p => !c.products.some(pid => String(pid) === String(p.id)));
                      return (
                        <div key={c.id} className="p-2.5 rounded-xl" style={{ background: 'var(--admin-surface2)', border: '1px solid var(--admin-border2)' }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <input
                              value={c.name}
                              onChange={e => specialCatPatch(c.id, { name: e.target.value })}
                              className="flex-1 min-w-0 px-2 py-1 rounded-lg text-[11px] font-semibold outline-none"
                              style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }}
                            />
                            <button onClick={() => specialCatMove(i, -1)} disabled={i === 0}
                              className="p-1.5 rounded-md" style={{ color: 'var(--admin-muted)' }} title="Monter">
                              <ChevronUp size={12} />
                            </button>
                            <button onClick={() => specialCatMove(i, 1)} disabled={i === specialCats.length - 1}
                              className="p-1.5 rounded-md" style={{ color: 'var(--admin-muted)' }} title="Descendre">
                              <ChevronDown size={12} />
                            </button>
                            <button onClick={() => specialCatDelete(c)}
                              className="p-1.5 rounded-md" style={{ color: '#ef4444' }} title="Supprimer">
                              <Trash2 size={12} />
                            </button>
                          </div>
                          {c.imageUrl && (
                            <div className="mb-1.5 rounded-lg overflow-hidden" style={{ border: '1px solid var(--admin-border2)' }}>
                              <img src={c.imageUrl} alt="couverture" className="w-full h-16 object-cover" />
                            </div>
                          )}
                          <label className="block mb-1.5">
                            <span className="text-[9px] font-semibold" style={{ color: 'var(--admin-muted)' }}>Image de couverture (URL)</span>
                            <input
                              value={c.imageUrl || ''}
                              placeholder="https://… ou /uploads/images/…"
                              onChange={e => specialCatPatch(c.id, { imageUrl: e.target.value })}
                              className="w-full mt-0.5 px-2 py-1.5 rounded-lg text-[11px] outline-none"
                              style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }}
                            />
                          </label>
                          <p className="text-[9px] font-bold tracking-wide mb-1" style={{ color: 'var(--admin-gold)' }}>
                            PRODUITS ({c.products.length})
                          </p>
                          <div className="space-y-1.5 mb-1.5">
                            {assigned.map(p => (
                              <div key={p.id} className="flex items-center gap-1.5 p-1.5 rounded-lg" style={{ background: 'var(--admin-bg)' }}>
                                {p.imageUrl
                                  ? <img src={p.imageUrl} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                                  : <div className="w-6 h-6 rounded flex items-center justify-center text-[8px]" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted2)' }}>img</div>
                                }
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-semibold truncate">{p.name}</p>
                                  <p className="text-[9px]" style={{ color: 'var(--admin-muted)' }}>
                                    {p.salePrice.toLocaleString()} DA {p.promoPrice ? <span style={{ color: 'var(--admin-gold)' }}>→ {p.promoPrice.toLocaleString()} DA</span> : ''}
                                  </p>
                                </div>
                                <button onClick={() => specialCatRemoveProduct(c, String(p.id))}
                                  className="p-1 rounded-md" style={{ color: '#ef4444' }} title="Retirer de la catégorie">
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            ))}
                            {missing.length > 0 && (
                              <p className="text-[9px] px-1" style={{ color: 'var(--admin-muted2)' }}>
                                {missing.length} produit{missing.length > 1 ? 's' : ''} supprimé{missing.length > 1 ? 's' : ''} (introuvable{missing.length > 1 ? 's' : ''}).
                              </p>
                            )}
                            {assigned.length === 0 && missing.length === 0 && (
                              <p className="text-[9px] px-1" style={{ color: 'var(--admin-muted2)' }}>
                                Aucun produit. Choisissez-en un ci-dessous.
                              </p>
                            )}
                          </div>
                          {available.length > 0 && (
                            <AdminSelect
                              value=""
                              onChange={v => specialCatAddProduct(c, v || '')}
                              title="Ajouter un produit"
                              className="w-full px-2 py-1.5 rounded-lg text-[10px] outline-none"
                              options={[{ value: '', label: '+ Ajouter un produit…' }, ...available.map(p => ({ value: String(p.id), label: p.name }))]}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTool === 'preorder' && (
                <div>
                  <p className="text-[11px] font-bold tracking-wide mb-1" style={{ color: 'var(--admin-gold)' }}>PRÉCOMMANDE</p>
                  <p className="text-[10px] mb-3" style={{ color: 'var(--admin-muted2)' }}>
                    Réglage du compte à rebours du thème « Mister-D Preorder ». Avant la date de lancement, le bouton reste verrouillé ;
                    à l’ouverture, il ajoute le produit au panier. La fenêtre dure {Math.max(1, Number(settings.preorderWindowDays) || 6)} jours après le lancement.
                  </p>

                  <label className="block mb-3">
                    <span className="text-[9px] font-semibold" style={{ color: 'var(--admin-muted)' }}>Date de lancement (heure locale)</span>
                    <input
                      type="datetime-local"
                      value={(settings.preorderStart || '').slice(0, 16)}
                      onChange={e => setSettings(s => ({ ...s, preorderStart: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                      className="w-full mt-0.5 px-2 py-1.5 rounded-lg text-[11px] outline-none"
                      style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }}
                    />
                    <span className="text-[9px]" style={{ color: 'var(--admin-muted2)' }}>Laisser vide = lancement dans 15 jours.</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <label className="block">
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--admin-muted)' }}>Fenêtre (jours)</span>
                      <input
                        type="number"
                        min={1}
                        value={Number(settings.preorderWindowDays) || 6}
                        onChange={e => setSettings(s => ({ ...s, preorderWindowDays: e.target.value ? Math.max(1, Number(e.target.value)) : 6 }))}
                        className="w-full mt-0.5 px-2 py-1.5 rounded-lg text-[11px] outline-none"
                        style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--admin-muted)' }}>Prix promo ($)</span>
                      <input
                        type="number"
                        min={0}
                        value={Number(settings.preorderPrice) || 5500}
                        onChange={e => setSettings(s => ({ ...s, preorderPrice: e.target.value ? Number(e.target.value) : 5500 }))}
                        className="w-full mt-0.5 px-2 py-1.5 rounded-lg text-[11px] outline-none"
                        style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--admin-muted)' }}>Prix normal ($)</span>
                      <input
                        type="number"
                        min={0}
                        value={Number(settings.preorderStrike) || 7500}
                        onChange={e => setSettings(s => ({ ...s, preorderStrike: e.target.value ? Number(e.target.value) : 7500 }))}
                        className="w-full mt-0.5 px-2 py-1.5 rounded-lg text-[11px] outline-none"
                        style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }}
                      />
                    </label>
                  </div>

                  <p className="text-[9px] p-2 rounded-lg" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted)' }}>
                    Astuce : pour tester, choisissez une date passée — le bouton « Pré‑commander » se déverrouille immédiatement.
                  </p>
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
