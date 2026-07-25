import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, ChevronUp, ChevronDown, Plus, Trash2, Palette, Type, Sparkles,
  Package, LayoutGrid, Paintbrush, Edit2, Check, X, Eye, Search,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  RefreshCw, ZoomIn, ZoomOut, RotateCcw, ToggleLeft, ToggleRight,
  Tag, Image, Layers, Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import NotificationBell from '../../components/NotificationBell';

type RawCatalog = { id: string; name?: string; barcode?: string; productId?: string; isActive?: boolean; promoPrice?: number | null; costPrice?: number | null; stockQty?: number; imageUrl?: string | null; displayOrder?: number; customName?: string | null; customPrice?: number | null; customDescription?: string | null; specs?: string | null; product?: { id: string; name: string; salePrice: number; barcode?: string | null; imageUrl?: string | null; stockQty: number } | null; category?: { id: string; name: string; imageUrl?: string | null } | null };
type CatalogProduct = { id: string; name: string; salePrice: number; imageUrl?: string | null; stockQty: number; category?: { id: string; name: string } | null; barcode?: string | null; displayOrder?: number; isActive?: boolean; promoPrice?: number | null; costPrice?: number | null; customName?: string | null; customPrice?: number | null; customDescription?: string | null; productId?: string | null; specs?: string | null };
type Category = { id: string; name: string; imageUrl?: string | null; position?: number };
type ThemeSettings = {
  productOrder: string[]; categoryOrder: string[]; fontFamily: string;
  bgColor: string; surfaceColor: string; textColor: string; accentColor: string;
  glowEnabled: boolean; glowColor: string; animationEnabled: boolean;
  bannerText: string; heroImage: string; storeName: string; tagline: string;
};
type SelectedElement = { type: 'product' | 'category' | 'theme'; id: string; data: any };

const DEFAULTS: ThemeSettings = {
  productOrder: [], categoryOrder: [], fontFamily: "'Unbounded', sans-serif",
  bgColor: '#0a0a0a', surfaceColor: '#141414', textColor: '#f5f1e8', accentColor: '#bfa24e',
  glowEnabled: true, glowColor: '#bfa24e', animationEnabled: true,
  bannerText: 'Commandez, on vous livre', heroImage: '', storeName: 'MISTER-DR', tagline: 'Parcourez notre catalogue et recevez vos produits directement chez vous.',
};

const FONTS = [
  { label: 'Unbounded', value: "'Unbounded', sans-serif" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
  { label: 'Manrope', value: "'Manrope', sans-serif" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace" },
  { label: 'Outfit', value: "'Outfit', sans-serif" },
  { label: 'Sora', value: "'Sora', sans-serif" },
  { label: 'DM Sans', value: "'DM Sans', sans-serif" },
  { label: 'Nunito', value: "'Nunito', sans-serif" },
  { label: 'Work Sans', value: "'Work Sans', sans-serif" },
];

const PRESETS = [
  { name: 'Noir & Or', bg: '#0a0a0a', surface: '#141414', text: '#f5f1e8', accent: '#bfa24e', glow: '#bfa24e' },
  { name: 'Bleu Tech', bg: '#0a0f1a', surface: '#111827', text: '#e2e8f0', accent: '#3b82f6', glow: '#3b82f6' },
  { name: 'Vert Sombre', bg: '#0a1a0f', surface: '#111f15', text: '#e2f0e5', accent: '#22c55e', glow: '#22c55e' },
  { name: 'Violet', bg: '#120a1a', surface: '#1a1127', text: '#e8e2f0', accent: '#a855f7', glow: '#a855f7' },
  { name: 'Rouge & Noir', bg: '#1a0a0a', surface: '#271111', text: '#f0e2e2', accent: '#ef4444', glow: '#ef4444' },
  { name: 'Rose Gold', bg: '#1a0f12', surface: '#27151a', text: '#f0e2e6', accent: '#f472b6', glow: '#f472b6' },
];

export default function StorefrontEditor() {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Panel state */
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<'products' | 'categories' | 'theme'>('products');
  const [zoom, setZoom] = useState(65);

  /* Selection */
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /* Edit state */
  const [editForm, setEditForm] = useState({ name: '', salePrice: '', stockQty: '', categoryId: '', imageUrl: '', promoPrice: '', specs: '', costPrice: '' });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const editFileRef = useRef<HTMLInputElement>(null);
  const [newCatName, setNewCatName] = useState('');
  const [addStock, setAddStock] = useState('');
  const [addCategoryId, setAddCategoryId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customSpecs, setCustomSpecs] = useState('');
  const [customCostPrice, setCustomCostPrice] = useState('');
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState('');
  const addFileRef = useRef<HTMLInputElement>(null);
  const [newCatImageUrl, setNewCatImageUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'product' | 'category'; id: string; name: string } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  /* ── Data loading ── */
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        api.get('/catalog').then(r => setCatalog((r.data || []).map((raw: RawCatalog): CatalogProduct => {
          const p = raw.product;
          return {
            id: raw.id,
            name: raw.name || p?.name || 'Produit',
            salePrice: raw.salePrice ?? p?.salePrice ?? 0,
            imageUrl: raw.imageUrl || p?.imageUrl || null,
            stockQty: raw.stockQty ?? p?.stockQty ?? 0,
            category: raw.category || null,
            barcode: raw.barcode || p?.barcode || null,
            displayOrder: raw.displayOrder,
            isActive: raw.isActive,
            promoPrice: raw.promoPrice ?? null,
            costPrice: raw.costPrice ?? null,
            customName: raw.customName || null,
            customPrice: raw.customPrice ?? null,
            customDescription: raw.customDescription || null,
            productId: raw.productId || null,
            specs: raw.specs || null,
          };
        }))),
        api.get('/categories/public').then(r => setCategories(r.data || [])),
        api.get('/storefront/settings').then(r => { if (r.data && Object.keys(r.data).length > 0) setSettings(prev => ({ ...prev, ...r.data })); }).catch(() => {}),
      ]);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Save ── */
  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/storefront/settings/main', { value: settings });
      // Save any modified category images
      for (const cat of categories) {
        const catState = orderedCategories.find((c: any) => c.id === cat.id);
        if (catState && (catState as any).imageUrl !== (cat as any).imageUrl) {
          await api.put(`/categories/${cat.id}`, { imageUrl: (catState as any).imageUrl || null });
        }
      }
      toast.success('Sauvegardé !');
    }
    catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  /* ── Helpers ── */
  const getOrdered = <T extends { id: string }>(items: T[], order: string[]): T[] => {
    if (order.length === 0) return items;
    const map = new Map(items.map(i => [i.id, i]));
    return order.map(id => map.get(id)).filter(Boolean) as T[];
  };

  const moveItem = (key: 'productOrder' | 'categoryOrder', allIds: string[], idx: number, dir: -1 | 1) => {
    setSettings(s => {
      const order = [...(s[key].length > 0 ? s[key] : allIds)];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= order.length) return s;
      [order[idx], order[swapIdx]] = [order[swapIdx], order[idx]];
      return { ...s, [key]: order };
    });
  };

  /* ── Product CRUD ── */
  const selectProduct = (p: CatalogProduct) => {
    setSelected({ type: 'product', id: p.id, data: p });
    setEditForm({ name: p.name, salePrice: String(p.salePrice), stockQty: String(p.stockQty), categoryId: p.category?.id || '', imageUrl: p.imageUrl || '', promoPrice: p.promoPrice != null ? String(p.promoPrice) : '', specs: p.specs || '', costPrice: p.costPrice != null ? String(p.costPrice) : '' });
    setEditImageFile(null); setEditImagePreview('');
    if (!rightOpen) setRightOpen(true);
  };

  const saveEdit = async () => {
    if (!selected || selected.type !== 'product') return;
    try {
      const fd = new FormData();
      fd.append('catalogId', selected.id);
      fd.append('name', editForm.name);
      fd.append('salePrice', String(Number(editForm.salePrice)));
      fd.append('stockQty', String(Number(editForm.stockQty)));
      if (editForm.categoryId) fd.append('categoryId', editForm.categoryId);
      if (editImageFile) fd.append('image', editImageFile);
      else if (editForm.imageUrl) fd.append('imageUrl', editForm.imageUrl);
      if (editForm.promoPrice) fd.append('promoPrice', String(Number(editForm.promoPrice)));
      if (editForm.costPrice) fd.append('costPrice', String(Number(editForm.costPrice)));
      if (editForm.specs) fd.append('specs', editForm.specs);
      await api.post('/products', fd);
      toast.success('Modifié');
      setSelected(null); setEditImageFile(null); setEditImagePreview('');
      loadAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const deleteItem = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'product') await api.delete(`/products/${confirmDelete.id}`);
      else await api.delete(`/categories/${confirmDelete.id}`);
      toast.success('Supprimé'); setConfirmDelete(null); setSelected(null); loadAll();
    } catch { toast.error('Erreur'); }
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try { await api.post('/categories', { name: newCatName.trim(), imageUrl: newCatImageUrl || undefined }); toast.success('Ajoutée'); setNewCatName(''); setNewCatImageUrl(''); loadAll(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const seedCategories = async () => {
    try {
      const r = await api.post('/categories/seed');
      toast.success(r.data.message || 'Catégories par défaut créées'); loadAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur seed'); }
  };

  const addProductToCatalog = async () => {
    if (!customName.trim()) { toast.error('Nom du produit requis'); return; }
    try {
      const fd = new FormData();
      fd.append('name', customName.trim());
      fd.append('salePrice', String(Number(customPrice) || 0));
      fd.append('stockQty', String(Number(addStock) || 0));
      if (customDesc.trim()) fd.append('description', customDesc.trim());
      if (customSpecs.trim()) fd.append('specs', customSpecs.trim());
      if (customCostPrice) fd.append('costPrice', String(Number(customCostPrice)));
      if (addCategoryId) fd.append('categoryId', addCategoryId);
      if (addImageFile) fd.append('image', addImageFile);
      await api.post('/products', fd);
      toast.success('Produit ajouté');
      setCustomName(''); setCustomPrice(''); setCustomDesc(''); setCustomSpecs(''); setCustomCostPrice(''); setAddStock(''); setAddCategoryId(''); setAddImageFile(null); setAddImagePreview('');
      loadAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const orderedProducts = useMemo(() => getOrdered(catalog, settings.productOrder), [catalog, settings.productOrder]);
  const orderedCategories = useMemo(() => getOrdered(categories, settings.categoryOrder), [categories, settings.categoryOrder]);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="text-center">
        <RefreshCw size={28} className="mx-auto mb-3 animate-spin" style={{ color: '#bfa24e' }} />
        <p className="text-sm" style={{ color: '#8c8578' }}>Chargement...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 md:-m-6" style={{ background: '#0d0d0d' }}>
      {/* ══════ TOP TOOLBAR ══════ */}
      <div className="flex items-center gap-3 px-3 py-2 flex-shrink-0" style={{ background: '#111', borderBottom: '1px solid rgba(191,162,78,0.12)' }}>
        <button onClick={() => setLeftOpen(!leftOpen)} className="p-1.5 rounded-lg" style={{ color: leftOpen ? '#bfa24e' : '#555' }} title="Panneau gauche">
          {leftOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

        <div className="h-5 w-px" style={{ background: 'rgba(191,162,78,0.12)' }} />

        {/* Zoom */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.max(25, z - 10))} className="p-1 rounded" style={{ color: '#8c8578' }}><ZoomOut size={14} /></button>
          <div className="w-20 h-1.5 rounded-full relative cursor-pointer" style={{ background: '#222' }} onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setZoom(Math.round(((e.clientX - r.left) / r.width) * 100)); }}>
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{ background: '#bfa24e', left: `${zoom}%`, transform: 'translate(-50%, -50%)' }} />
          </div>
          <button onClick={() => setZoom(z => Math.min(100, z + 10))} className="p-1 rounded" style={{ color: '#8c8578' }}><ZoomIn size={14} /></button>
          <button onClick={() => setZoom(65)} className="p-1 rounded" style={{ color: '#555' }} title="Réinitialiser"><RotateCcw size={12} /></button>
          <span className="text-[10px] font-mono w-8 text-center" style={{ color: '#8c8578' }}>{zoom}%</span>
        </div>

        <div className="h-5 w-px" style={{ background: 'rgba(191,162,78,0.12)' }} />

        <p className="text-xs font-extrabold tracking-wide" style={{ fontFamily: "'Unbounded', sans-serif", background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          ÉDITEUR
        </p>

        <div className="flex-1" />

        <button onClick={loadAll} className="p-1.5 rounded-lg" style={{ color: '#8c8578' }} title="Actualiser"><RefreshCw size={14} /></button>
        <NotificationBell />
        <button onClick={saveSettings} disabled={saving} className="gold-btn px-4 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
          <Save size={12} /> {saving ? '...' : 'Sauvegarder'}
        </button>

        <div className="h-5 w-px" style={{ background: 'rgba(191,162,78,0.12)' }} />

        <button onClick={() => setRightOpen(!rightOpen)} className="p-1.5 rounded-lg" style={{ color: rightOpen ? '#bfa24e' : '#555' }} title="Panneau propriétés">
          {rightOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>

      {/* ══════ MAIN AREA ══════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ──────── LEFT SIDEBAR ──────── */}
        <AnimatePresence>
          {leftOpen && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 overflow-hidden border-r" style={{ borderColor: 'rgba(191,162,78,0.1)', background: '#111' }}>
              <div className="w-[280px] h-full flex flex-col">
                {/* Tabs */}
                <div className="flex gap-0.5 p-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(191,162,78,0.08)' }}>
                  {([['products', Package, 'Produits'], ['categories', LayoutGrid, 'Catégories'], ['theme', Palette, 'Thème']] as const).map(([k, Icon, label]) => (
                    <button key={k} onClick={() => { setLeftTab(k as any); if (k === 'theme') {} }} className="flex-1 py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1" style={{ background: leftTab === k ? 'rgba(191,162,78,0.12)' : 'transparent', color: leftTab === k ? '#bfa24e' : '#8c8578' }}>
                      <Icon size={11} /> {label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {/* ── PRODUCTS LIST ── */}
                  {leftTab === 'products' && (
                    <>
                      <button onClick={() => setShowAddForm(!showAddForm)} className="w-full py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 gold-btn">
                        {showAddForm ? <><X size={11} /> Fermer</> : <><Plus size={11} /> Ajouter un produit</>}
                      </button>
                      {showAddForm && (
                        <div className="p-2 rounded-lg space-y-2" style={{ background: 'rgba(191,162,78,0.06)', border: '1px solid rgba(191,162,78,0.15)' }}>
                          <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Nom du produit" className="input-field text-[10px] w-full py-1.5" />
                          <div className="grid grid-cols-2 gap-1.5">
                            <input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="Prix vente (DA)" className="input-field text-[10px] py-1.5" />
                            <input type="number" value={customCostPrice} onChange={e => setCustomCostPrice(e.target.value)} placeholder="Prix achat (DA)" className="input-field text-[10px] py-1.5" />
                          </div>
                          <input value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Description (optionnel)" className="input-field text-[10px] w-full py-1.5" />
                          <div>
                            <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>Spécifications</label>
                            <textarea value={customSpecs} onChange={e => setCustomSpecs(e.target.value)} placeholder="Ex: Intel Core i5 13ème Gen, 4.5GHz, 16GB RAM DDR5..." rows={2} className="input-field text-[10px] w-full resize-none" />
                          </div>
                          {/* Image upload */}
                          <input ref={addFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                            const file = e.target.files?.[0] || null;
                            setAddImageFile(file);
                            if (file) { const reader = new FileReader(); reader.onload = ev => setAddImagePreview(ev.target?.result as string); reader.readAsDataURL(file); }
                            else setAddImagePreview('');
                          }} />
                          <button onClick={() => addFileRef.current?.click()} className="w-full py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1" style={{ background: '#0a0a0a', color: addImageFile ? '#bfa24e' : '#555', border: '1px solid rgba(191,162,78,0.1)' }}>
                            <Upload size={10} /> {addImageFile ? 'Image sélectionnée' : 'Ajouter une image'}
                          </button>
                          {addImagePreview && <div className="h-16 rounded-lg overflow-hidden" style={{ background: '#0a0a0a' }}><img src={addImagePreview} alt="" className="w-full h-full object-contain" /></div>}

                          <select value={addCategoryId} onChange={e => setAddCategoryId(e.target.value)} className="input-field text-[10px] w-full py-1.5">
                            <option value="">Catégorie (optionnel)</option>
                            {orderedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <input type="number" value={addStock} onChange={e => setAddStock(e.target.value)} placeholder="Stock" className="input-field text-[10px] w-full py-1.5" />
                          <button onClick={addProductToCatalog} className="w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1" style={{ background: 'rgba(191,162,78,0.15)', color: '#bfa24e', border: '1px solid rgba(191,162,78,0.2)' }}>
                            <Plus size={10} /> Ajouter à la boutique
                          </button>
                        </div>
                      )}
                      {orderedProducts.map((p, i) => (
                        <div key={p.id} onClick={() => selectProduct(p)} className="p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all" style={{ background: selected?.id === p.id ? 'rgba(191,162,78,0.12)' : hoveredId === p.id ? 'rgba(191,162,78,0.06)' : 'transparent', border: `1px solid ${selected?.id === p.id ? 'rgba(191,162,78,0.25)' : 'transparent'}` }} onMouseEnter={() => setHoveredId(p.id)} onMouseLeave={() => setHoveredId(null)}>
                          <div className="flex flex-col gap-0.5 flex-shrink-0">
                            <button onClick={e => { e.stopPropagation(); moveItem('productOrder', catalog.map(x => x.id), i, -1); }} disabled={i === 0} className="p-0" style={{ color: i === 0 ? '#222' : '#bfa24e' }}><ChevronUp size={10} /></button>
                            <button onClick={e => { e.stopPropagation(); moveItem('productOrder', catalog.map(x => x.id), i, 1); }} disabled={i === orderedProducts.length - 1} className="p-0" style={{ color: i === orderedProducts.length - 1 ? '#222' : '#bfa24e' }}><ChevronDown size={10} /></button>
                          </div>
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#0a0a0a' }}>
                            {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package size={10} style={{ color: '#333' }} /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate">{p.name}</p>
                            <p className="text-[9px]" style={{ color: '#555' }}>{p.salePrice} DA</p>
                          </div>
                          <span className="text-[8px] font-mono" style={{ color: '#444' }}>#{i + 1}</span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* ── CATEGORIES LIST ── */}
                  {leftTab === 'categories' && (
                    <>
                      {categories.length === 0 && (
                        <button onClick={seedCategories} className="w-full py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 gold-btn">
                          <Sparkles size={10} /> Charger les catégories par défaut
                        </button>
                      )}
                      <div className="space-y-1">
                        <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nouvelle catégorie..." className="input-field flex-1 text-[10px] py-1.5 w-full" onKeyDown={e => e.key === 'Enter' && addCategory()} />
                        <input value={newCatImageUrl} onChange={e => setNewCatImageUrl(e.target.value)} placeholder="URL image (optionnel)" className="input-field text-[10px] py-1.5 w-full" />
                        <button onClick={addCategory} disabled={!newCatName.trim()} className="w-full py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 disabled:opacity-30" style={{ background: 'rgba(191,162,78,0.15)', color: '#bfa24e', border: '1px solid rgba(191,162,78,0.2)' }}>
                          <Plus size={10} /> Ajouter
                        </button>
                      </div>
                      {orderedCategories.map((c, i) => (
                        <div key={c.id} className="p-2 rounded-lg flex items-center gap-2" style={{ background: selected?.id === c.id ? 'rgba(191,162,78,0.12)' : 'transparent', border: `1px solid ${selected?.id === c.id ? 'rgba(191,162,78,0.25)' : 'transparent'}` }}>
                          <div className="flex flex-col gap-0.5 flex-shrink-0">
                            <button onClick={() => moveItem('categoryOrder', categories.map(x => x.id), i, -1)} disabled={i === 0} className="p-0" style={{ color: i === 0 ? '#222' : '#bfa24e' }}><ChevronUp size={10} /></button>
                            <button onClick={() => moveItem('categoryOrder', categories.map(x => x.id), i, 1)} disabled={i === orderedCategories.length - 1} className="p-0" style={{ color: i === orderedCategories.length - 1 ? '#222' : '#bfa24e' }}><ChevronDown size={10} /></button>
                          </div>
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#0a0a0a' }}>
                            {(c as any).imageUrl ? <img src={(c as any).imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><LayoutGrid size={12} style={{ color: '#bfa24e' }} /></div>}
                          </div>
                          <p className="text-[11px] font-medium flex-1" onClick={() => { setSelected({ type: 'category', id: c.id, data: c }); if (!rightOpen) setRightOpen(true); }}>{c.name}</p>
                          <button onClick={() => setConfirmDelete({ type: 'category', id: c.id, name: c.name })} className="p-1" style={{ color: '#d9603b' }}><Trash2 size={10} /></button>
                        </div>
                      ))}
                    </>
                  )}

                  {/* ── THEME QUICK ── */}
                  {leftTab === 'theme' && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold" style={{ color: '#555' }}>THÈMES RAPIDES</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PRESETS.map(p => (
                          <button key={p.name} onClick={() => { setSettings(s => ({ ...s, bgColor: p.bg, surfaceColor: p.surface, textColor: p.text, accentColor: p.accent, glowColor: p.glow })); toast.success(p.name); }} className="p-2 rounded-lg text-left" style={{ background: '#0a0a0a', border: '1px solid rgba(191,162,78,0.06)' }}>
                            <div className="flex gap-1 mb-1"><div className="w-3 h-3 rounded-full" style={{ background: p.bg, border: '1px solid #333' }} /><div className="w-3 h-3 rounded-full" style={{ background: p.accent }} /><div className="w-3 h-3 rounded-full" style={{ background: p.surface, border: '1px solid #333' }} /></div>
                            <p className="text-[9px] font-semibold">{p.name}</p>
                          </button>
                        ))}
                      </div>
                      <div className="h-px" style={{ background: 'rgba(191,162,78,0.08)' }} />
                      <p className="text-[10px] font-bold" style={{ color: '#555' }}>COULEURS</p>
                      {([['bgColor', 'Fond'], ['surfaceColor', 'Cartes'], ['textColor', 'Texte'], ['accentColor', 'Accent'], ['glowColor', 'Glow']] as const).map(([k, label]) => (
                        <div key={k} className="flex items-center gap-2">
                          <input type="color" value={settings[k]} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))} className="w-6 h-6 rounded border-0 cursor-pointer" />
                          <span className="text-[10px] flex-1" style={{ color: '#8c8578' }}>{label}</span>
                          <input value={settings[k]} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))} className="text-[9px] font-mono w-16 text-right bg-transparent border-0 outline-none" style={{ color: '#555' }} />
                        </div>
                      ))}
                      <div className="h-px" style={{ background: 'rgba(191,162,78,0.08)' }} />
                      <p className="text-[10px] font-bold" style={{ color: '#555' }}>POLICE</p>
                      <div className="grid grid-cols-2 gap-1">
                        {FONTS.slice(0, 6).map(f => (
                          <button key={f.value} onClick={() => setSettings(s => ({ ...s, fontFamily: f.value }))} className="py-1.5 rounded-lg text-[9px]" style={{ background: settings.fontFamily === f.value ? 'rgba(191,162,78,0.12)' : '#0a0a0a', color: settings.fontFamily === f.value ? '#bfa24e' : '#8c8578', fontFamily: f.value }}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <div className="h-px" style={{ background: 'rgba(191,162,78,0.08)' }} />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: '#8c8578' }}>Glow</span>
                        <button onClick={() => setSettings(s => ({ ...s, glowEnabled: !s.glowEnabled }))}>
                          {settings.glowEnabled ? <ToggleRight size={20} style={{ color: settings.accentColor }} /> : <ToggleLeft size={20} style={{ color: '#333' }} />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: '#8c8578' }}>Animations</span>
                        <button onClick={() => setSettings(s => ({ ...s, animationEnabled: !s.animationEnabled }))}>
                          {settings.animationEnabled ? <ToggleRight size={20} style={{ color: settings.accentColor }} /> : <ToggleLeft size={20} style={{ color: '#333' }} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ──────── CENTER CANVAS ──────── */}
        <div className="flex-1 overflow-auto relative" style={{ background: '#0a0a0a', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(191,162,78,0.04) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
          <div className="flex justify-center py-8 min-h-full">
            <div ref={canvasRef} className="origin-top" style={{ width: 1200, transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
              {/* ═══ LIVE CLIENT PAGE RENDER ═══ */}
              <div style={{ background: settings.bgColor, fontFamily: settings.fontFamily, color: settings.textColor, borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}>

                {/* HERO */}
                <div className="text-center py-16 px-8 relative" style={{ background: settings.surfaceColor }}
                  onMouseEnter={() => setHoveredId('hero')} onMouseLeave={() => setHoveredId(null)}
                  onClick={() => { setSelected({ type: 'theme', id: 'hero', data: settings }); if (!rightOpen) setRightOpen(true); }}
                >
                  {hoveredId === 'hero' && <div className="absolute inset-0 border-2 border-dashed rounded-lg pointer-events-none" style={{ borderColor: settings.accentColor + '80' }} />}
                  {selected?.id === 'hero' && <div className="absolute inset-0 border-2 rounded-lg pointer-events-none" style={{ borderColor: settings.accentColor }} />}
                  {settings.heroImage && <div className="rounded-xl overflow-hidden mb-4 mx-auto" style={{ maxWidth: 600, height: 140 }}><img src={settings.heroImage} alt="" className="w-full h-full object-cover" /></div>}
                  <p className="text-[10px] tracking-[0.3em] font-bold mb-3" style={{ color: settings.accentColor, fontFamily: "'IBM Plex Mono', monospace" }}>LIVRAISON RAPIDE</p>
                  <h1 className="text-4xl font-extrabold leading-tight max-w-2xl mx-auto mb-3">{settings.bannerText}</h1>
                  <p className="text-sm max-w-lg mx-auto" style={{ color: '#8c8578' }}>{settings.tagline}</p>
                </div>

                {/* CATEGORIES BAR */}
                {orderedCategories.length > 0 && (
                  <div className="px-6 py-4 flex gap-2 overflow-x-auto" style={{ borderBottom: `1px solid ${settings.surfaceColor}` }}>
                    <span className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: settings.accentColor, color: settings.bgColor }}>Tout</span>
                    {orderedCategories.map(c => (
                      <span key={c.id} className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer" style={{ background: settings.surfaceColor, color: '#8c8578' }}
                        onMouseEnter={() => setHoveredId(`cat-${c.id}`)} onMouseLeave={() => setHoveredId(null)}
                        onClick={() => { setSelected({ type: 'category', id: c.id, data: c }); if (!rightOpen) setRightOpen(true); }}
                      >
                        {hoveredId === `cat-${c.id}` && <span style={{ color: settings.accentColor }}>{c.name}</span>}
                        {hoveredId !== `cat-${c.id}` && c.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* PRODUCTS GRID */}
                <div className="grid grid-cols-4 gap-4 p-6">
                  {orderedProducts.map((p, i) => (
                    <div key={p.id} className="rounded-xl overflow-hidden cursor-pointer transition-all"
                      style={{ background: settings.surfaceColor, boxShadow: (hoveredId === p.id || selected?.id === p.id) && settings.glowEnabled ? `0 0 24px ${settings.glowColor}25` : 'none', outline: selected?.id === p.id ? `2px solid ${settings.accentColor}` : hoveredId === p.id ? `1px dashed ${settings.accentColor}60` : 'none', outlineOffset: selected?.id === p.id ? 2 : 0 }}
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
                    </div>
                  ))}
                </div>

                {/* EMPTY STATE */}
                {orderedProducts.length === 0 && (
                  <div className="text-center py-20">
                    <Package size={40} className="mx-auto mb-3" style={{ color: '#333' }} />
                    <p className="text-sm">Aucun produit</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ──────── RIGHT SIDEBAR (Properties) ──────── */}
        <AnimatePresence>
          {rightOpen && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 overflow-hidden border-l" style={{ borderColor: 'rgba(191,162,78,0.1)', background: '#111' }}>
              <div className="w-[300px] h-full overflow-y-auto">
                {selected ? (
                  <div className="p-3 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] tracking-widest font-bold" style={{ color: '#555' }}>PROPRIÉTÉS</p>
                        <p className="text-xs font-bold" style={{ color: '#bfa24e' }}>{selected.type === 'product' ? 'Produit' : selected.type === 'category' ? 'Catégorie' : 'Thème'}</p>
                      </div>
                      <button onClick={() => setSelected(null)} className="p-1 rounded-lg" style={{ color: '#555' }}><X size={14} /></button>
                    </div>

                    <div className="h-px" style={{ background: 'rgba(191,162,78,0.08)' }} />

                    {/* ── Product properties ── */}
                    {selected.type === 'product' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>NOM</label>
                          <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input-field text-xs w-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>PRIX VENTE (DA)</label>
                            <input type="number" value={editForm.salePrice} onChange={e => setEditForm(f => ({ ...f, salePrice: e.target.value }))} className="input-field text-xs w-full" />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>PRIX ACHAT (DA)</label>
                            <input type="number" value={editForm.costPrice} onChange={e => setEditForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="—" className="input-field text-xs w-full" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>PROMO (DA)</label>
                          <input type="number" value={editForm.promoPrice} onChange={e => setEditForm(f => ({ ...f, promoPrice: e.target.value }))} placeholder="—" className="input-field text-xs w-full" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>STOCK</label>
                          <input type="number" value={editForm.stockQty} onChange={e => setEditForm(f => ({ ...f, stockQty: e.target.value }))} className="input-field text-xs w-full" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>CATÉGORIE</label>
                          <select value={editForm.categoryId} onChange={e => setEditForm(f => ({ ...f, categoryId: e.target.value }))} className="input-field text-xs w-full">
                            <option value="">Sans catégorie</option>
                            {orderedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>IMAGE</label>
                          <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                            const file = e.target.files?.[0] || null;
                            setEditImageFile(file);
                            if (file) { const reader = new FileReader(); reader.onload = ev => setEditImagePreview(ev.target?.result as string); reader.readAsDataURL(file); }
                            else setEditImagePreview('');
                          }} />
                          <div className="flex gap-1">
                            <button onClick={() => editFileRef.current?.click()} className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1" style={{ background: '#0a0a0a', color: editImageFile ? '#bfa24e' : '#555', border: '1px solid rgba(191,162,78,0.1)' }}>
                              <Upload size={9} /> {editImageFile ? 'Image changée' : 'Changer l\'image'}
                            </button>
                          </div>
                        </div>
                        {(editImagePreview || editForm.imageUrl) && (
                          <div className="rounded-lg overflow-hidden" style={{ background: '#0a0a0a', height: 100 }}>
                            <img src={editImagePreview || editForm.imageUrl} alt="" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        )}
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>SPÉCIFICATIONS</label>
                          <textarea value={editForm.specs} onChange={e => setEditForm(f => ({ ...f, specs: e.target.value }))} placeholder="Ex: Intel Core i5 13ème Gen, 4.5GHz, 16GB RAM DDR5..." rows={3} className="input-field text-[10px] w-full resize-none" />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={saveEdit} className="gold-btn flex-1 py-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1"><Check size={11} /> Appliquer</button>
                          <button onClick={() => setSelected(null)} className="px-3 py-2 text-[11px] rounded-lg" style={{ background: '#1a1a1a', color: '#8c8578' }}>Annuler</button>
                        </div>
                        <div className="h-px" style={{ background: 'rgba(191,162,78,0.08)' }} />
                        <button onClick={() => setConfirmDelete({ type: 'product', id: selected.id, name: selected.data.name })} className="w-full py-2 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1" style={{ background: 'rgba(217,96,59,0.1)', color: '#d9603b' }}>
                          <Trash2 size={11} /> Supprimer de la boutique
                        </button>
                      </div>
                    )}

                    {/* ── Category properties ── */}
                    {selected.type === 'category' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>NOM</label>
                          <input value={selected.data.name} onChange={e => { const v = { ...selected.data, name: e.target.value }; setSelected({ ...selected, data: v }); }} className="input-field text-xs w-full" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#555' }}>IMAGE URL</label>
                          <input value={(selected.data as any).imageUrl || ''} onChange={e => { const v = { ...selected.data, imageUrl: e.target.value }; setSelected({ ...selected, data: v }); }} placeholder="https://..." className="input-field text-xs w-full" />
                        </div>
                        {(selected.data as any).imageUrl && (
                          <div className="rounded-lg overflow-hidden" style={{ background: '#0a0a0a', height: 80 }}>
                            <img src={(selected.data as any).imageUrl} alt="" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        )}
                        <button onClick={() => { setConfirmDelete({ type: 'category', id: selected.id, name: selected.data.name }); }} className="w-full py-2 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1" style={{ background: 'rgba(217,96,59,0.1)', color: '#d9603b' }}>
                          <Trash2 size={11} /> Supprimer la catégorie
                        </button>
                      </div>
                    )}

                    {/* ── Theme properties ── */}
                    {selected.type === 'theme' && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold" style={{ color: '#555' }}>IDENTITÉ</p>
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#444' }}>Nom boutique</label>
                          <input value={settings.storeName} onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))} className="input-field text-xs w-full" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#444' }}>Tagline</label>
                          <input value={settings.tagline} onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))} className="input-field text-xs w-full" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#444' }}>Texte hero</label>
                          <input value={settings.bannerText} onChange={e => setSettings(s => ({ ...s, bannerText: e.target.value }))} className="input-field text-xs w-full" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold block mb-1" style={{ color: '#444' }}>Image hero URL</label>
                          <input value={settings.heroImage} onChange={e => setSettings(s => ({ ...s, heroImage: e.target.value }))} placeholder="https://..." className="input-field text-xs w-full" />
                        </div>
                        <div className="h-px" style={{ background: 'rgba(191,162,78,0.08)' }} />
                        <p className="text-[10px] font-bold" style={{ color: '#555' }}>POLICE</p>
                        <div className="grid grid-cols-3 gap-1">
                          {FONTS.map(f => (
                            <button key={f.value} onClick={() => setSettings(s => ({ ...s, fontFamily: f.value }))} className="py-1.5 rounded-lg text-[9px]" style={{ background: settings.fontFamily === f.value ? 'rgba(191,162,78,0.12)' : '#0a0a0a', color: settings.fontFamily === f.value ? '#bfa24e' : '#8c8578', fontFamily: f.value }}>
                              {f.label}
                            </button>
                          ))}
                        </div>
                        <div className="h-px" style={{ background: 'rgba(191,162,78,0.08)' }} />
                        <p className="text-[10px] font-bold" style={{ color: '#555' }}>COULEURS</p>
                        {([['bgColor', 'Fond'], ['surfaceColor', 'Cartes'], ['textColor', 'Texte'], ['accentColor', 'Accent'], ['glowColor', 'Glow']] as const).map(([k, label]) => (
                          <div key={k} className="flex items-center gap-2">
                            <input type="color" value={settings[k]} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))} className="w-7 h-7 rounded-lg border-0 cursor-pointer" />
                            <span className="text-[10px] flex-1" style={{ color: '#8c8578' }}>{label}</span>
                            <input value={settings[k]} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))} className="text-[9px] font-mono w-16 text-right bg-transparent border-0 outline-none" style={{ color: '#555' }} />
                          </div>
                        ))}
                        <div className="h-px" style={{ background: 'rgba(191,162,78,0.08)' }} />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px]" style={{ color: '#8c8578' }}>Glow</span>
                          <button onClick={() => setSettings(s => ({ ...s, glowEnabled: !s.glowEnabled }))}>
                            {settings.glowEnabled ? <ToggleRight size={22} style={{ color: settings.accentColor }} /> : <ToggleLeft size={22} style={{ color: '#333' }} />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px]" style={{ color: '#8c8578' }}>Animations</span>
                          <button onClick={() => setSettings(s => ({ ...s, animationEnabled: !s.animationEnabled }))}>
                            {settings.animationEnabled ? <ToggleRight size={22} style={{ color: settings.accentColor }} /> : <ToggleLeft size={22} style={{ color: '#333' }} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* No selection */
                  <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                    <Layers size={32} style={{ color: '#222' }} />
                    <p className="text-xs font-semibold mt-3 mb-1" style={{ color: '#555' }}>Aucun élément sélectionné</p>
                    <p className="text-[10px]" style={{ color: '#444' }}>Cliquez sur un produit, une catégorie ou le hero dans l'aperçu pour modifier ses propriétés</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════ DELETE MODAL ══════ */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#1a1a1a', border: '1px solid rgba(191,162,78,0.15)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(217,96,59,0.15)' }}><Trash2 size={18} style={{ color: '#d9603b' }} /></div>
              <p className="text-sm font-bold mb-1">Supprimer "{confirmDelete.name}" ?</p>
              <p className="text-xs mb-5" style={{ color: '#8c8578' }}>Cette action est irréversible.</p>
              <div className="flex gap-2">
                <button onClick={deleteItem} className="flex-1 py-2.5 text-xs font-bold rounded-xl" style={{ background: '#d9603b', color: '#fff' }}>Supprimer</button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-xs font-semibold rounded-xl" style={{ background: '#333', color: '#8c8578' }}>Annuler</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
