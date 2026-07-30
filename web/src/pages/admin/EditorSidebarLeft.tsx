import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Plus, Trash2, Sparkles, Package, LayoutGrid, Palette, X, Upload, ToggleLeft, ToggleRight, Layout, Image, Type, Star, ShoppingBag, Truck, Heart, Zap, Shield, Gift, Phone, Mail, MapPin, Clock, Users, Minimize2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { CatalogProduct, Category, ThemeSettings, SelectedElement } from './editorTypes';
import { FONTS, PRESETS } from './editorTypes';

const STORE_KEY = 'delivery_storefront_layout';

/* ── Block HTML templates (from StorefrontBuilder) ── */
const HERO_HTML = () => `<div style="padding:80px 40px;text-align:center;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%);color:#f5f1e8;font-family:Inter,sans-serif;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;opacity:0.15;background:radial-gradient(circle at 30% 50%,#bfa24e 0%,transparent 60%)"></div>
  <div style="position:relative;z-index:2;max-width:800px;margin:0 auto">
    <h1 style="font-size:2.8rem;font-weight:800;margin:0 0 16px;font-family:'Unbounded',sans-serif;line-height:1.15">Bienvenue chez MISTER-DR</h1>
    <p style="font-size:1.1rem;color:#8c8578;margin:0 0 28px;line-height:1.6">Découvrez une sélection exceptionnelle de produits livrés chez vous.</p>
    <a href="#" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#bfa24e,#8a7530);color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Explorer la boutique</a>
  </div>
</div>`;

const GRID_HTML = (cols = 3) => `<div style="padding:40px;background:transparent;font-family:Inter,sans-serif" class="gjs-product-grid">
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

const FEATURES_HTML = () => `<div style="padding:60px 40px;background:transparent;font-family:Inter,sans-serif;text-align:center">
  <h2 style="font-size:1.6rem;font-weight:700;margin:0 0 40px;color:#f5f1e8;font-family:'Unbounded',sans-serif">Pourquoi nous choisir</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto">
    ${['Livraison Rapide','Qualité Garantie','Service Client'].map((t,i) => `
    <div style="padding:24px;background:#1a1a1a;border-radius:12px;border:1px solid rgba(191,162,78,0.08)">
      <div style="width:44px;height:44px;border-radius:10px;background:rgba(191,162,78,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:20px">${['🚚','⭐','💬'][i]}</div>
      <h3 style="font-size:0.95rem;font-weight:700;margin:0 0 6px;color:#f5f1e8">${t}</h3>
      <p style="font-size:0.8rem;color:#8c8578;margin:0;line-height:1.5">Description de ${t.toLowerCase()} pour votre boutique.</p>
    </div>`).join('')}
  </div>
</div>`;

function getLayout(): any[] {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const d = JSON.parse(raw); if (d?.components?.length) return d.components; } } catch {}
  return [];
}

function saveLayout(components: any[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ components, styles: [] }));
}

type Props = {
  leftOpen: boolean;
  leftTab: string; setLeftTab: (t: any) => void;
  orderedProducts: CatalogProduct[]; orderedCategories: Category[];
  selected: SelectedElement | null; setSelected: (el: SelectedElement | null) => void;
  hoveredId: string | null; setHoveredId: (id: string | null) => void;
  settings: ThemeSettings; setSettings: (s: ThemeSettings | ((prev: ThemeSettings) => ThemeSettings)) => void;
  selectProduct: (p: CatalogProduct) => void;
  moveItem: (key: 'productOrder' | 'categoryOrder', allIds: string[], idx: number, dir: -1 | 1) => void;
  onRefresh: () => void;
  rightOpen: boolean; setRightOpen: (o: boolean) => void;
  setCtxItem: (p: CatalogProduct | null) => void;
  ctxOpen: (e: React.MouseEvent) => void;
  catalogIds: string[]; categoriesIds: string[];
  layoutSections: any[];
  onLayoutChange: (sections: any[]) => void;
};

export default function EditorSidebarLeft(props: Props) {
  const { leftOpen, leftTab, setLeftTab, orderedProducts, orderedCategories, selected, setSelected, hoveredId, setHoveredId, settings, setSettings, selectProduct, moveItem, onRefresh, rightOpen, setRightOpen, setCtxItem, ctxOpen, catalogIds, categoriesIds, layoutSections, onLayoutChange } = props;

  /* Sidebar-local state */
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customCostPrice, setCustomCostPrice] = useState('');
  const [customMargin, setCustomMargin] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customSpecs, setCustomSpecs] = useState('');
  const addFileRef = useRef<HTMLInputElement>(null);
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState('');
  const [addCategoryId, setAddCategoryId] = useState('');
  const [addStock, setAddStock] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'product' | 'category'; id: string; name: string } | null>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const [bgUploading, setBgUploading] = useState(false);

  /* Internal functions */
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try { await api.post('/categories', { name: newCatName.trim(), imageUrl: newCatImageUrl || undefined }); toast.success('Ajoutée'); setNewCatName(''); setNewCatImageUrl(''); onRefresh(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const seedCategories = async () => {
    try { const r = await api.post('/categories/seed'); toast.success(r.data.message || 'Catégories par défaut créées'); onRefresh(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Erreur seed'); }
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
      setCustomName(''); setCustomPrice(''); setCustomDesc(''); setCustomSpecs(''); setCustomCostPrice(''); setCustomMargin(''); setAddStock(''); setAddCategoryId(''); setAddImageFile(null); setAddImagePreview('');
      onRefresh();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  return (
    <AnimatePresence>
      {leftOpen && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 overflow-hidden border-r" style={{ borderColor: 'var(--admin-border3)', background: 'var(--admin-surface)' }}>
          <div className="w-[280px] h-full flex flex-col">
            {/* Tabs */}
            <div className="flex gap-0.5 p-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--admin-border2)' }}>
              {([['products', Package, 'Produits'], ['categories', LayoutGrid, 'Catégories'], ['sections', Layout, 'Sections'], ['theme', Palette, 'Thème']] as const).map(([k, Icon, label]) => (
                <button key={k} onClick={() => { setLeftTab(k as any) }} className="flex-1 py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1" style={{ background: leftTab === k ? 'var(--admin-border2)' : 'transparent', color: leftTab === k ? 'var(--admin-gold)' : 'var(--admin-muted)' }}>
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
                    <div className="p-2 rounded-lg space-y-2" style={{ background: 'var(--admin-border3)', border: '1px solid var(--admin-gold-bg)' }}>
                      <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Nom du produit" className="input-field text-[10px] w-full py-1.5" />
                      <div className="grid grid-cols-3 gap-1.5">
                        <input type="number" value={customCostPrice} onChange={e => { setCustomCostPrice(e.target.value); const cost = Number(e.target.value) || 0; const margin = Number(customMargin) || 0; if (margin > 0 && cost > 0) setCustomPrice(String(Math.round(cost * (1 + margin / 100)))); }} placeholder="Achat (DA)" className="input-field text-[10px] py-1.5" />
                        <div className="relative">
                          <input type="number" value={customMargin} onChange={e => { setCustomMargin(e.target.value); const cost = Number(customCostPrice) || 0; const margin = Number(e.target.value) || 0; if (cost > 0 && margin > 0) setCustomPrice(String(Math.round(cost * (1 + margin / 100)))); }} placeholder="Marge %" className="input-field text-[10px] py-1.5 pr-4" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold" style={{ color: 'var(--admin-muted2)' }}>%</span>
                        </div>
                        <input type="number" value={customPrice} onChange={e => { setCustomPrice(e.target.value); const cost = Number(customCostPrice) || 0; const sale = Number(e.target.value) || 0; if (cost > 0 && sale > 0) setCustomMargin(String(Math.round(((sale - cost) / cost) * 100))); else setCustomMargin(''); }} placeholder="Vente (DA)" className="input-field text-[10px] py-1.5" />
                      </div>
                      <input value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Description (optionnel)" className="input-field text-[10px] w-full py-1.5" />
                      <div>
                        <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>Spécifications</label>
                        <textarea value={customSpecs} onChange={e => setCustomSpecs(e.target.value)} placeholder="Ex: Intel Core i5 13ème Gen, 4.5GHz, 16GB RAM DDR5..." rows={2} className="input-field text-[10px] w-full resize-none" />
                      </div>
                      <input ref={addFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0] || null; setAddImageFile(file); if (file) { const reader = new FileReader(); reader.onload = ev => setAddImagePreview(ev.target?.result as string); reader.readAsDataURL(file); } else setAddImagePreview(''); }} />
                      <button onClick={() => addFileRef.current?.click()} className="w-full py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1" style={{ background: 'var(--admin-bg)', color: addImageFile ? 'var(--admin-gold)' : 'var(--admin-muted2)', border: '1px solid var(--admin-border3)' }}>
                        <Upload size={10} /> {addImageFile ? 'Image sélectionnée' : 'Ajouter une image'}
                      </button>
                      {addImagePreview && <div className="h-16 rounded-lg overflow-hidden" style={{ background: 'var(--admin-bg)' }}><img src={addImagePreview} alt="" className="w-full h-full object-contain" /></div>}
                      <select value={addCategoryId} onChange={e => setAddCategoryId(e.target.value)} className="input-field text-[10px] w-full py-1.5">
                        <option value="">Catégorie (optionnel)</option>
                        {orderedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="number" value={addStock} onChange={e => setAddStock(e.target.value)} placeholder="Stock" className="input-field text-[10px] w-full py-1.5" />
                      <button onClick={addProductToCatalog} className="w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1" style={{ background: 'var(--admin-gold-bg)', color: 'var(--admin-gold)', border: '1px solid rgba(191,162,78,0.2)' }}>
                        <Plus size={10} /> Ajouter à la boutique
                      </button>
                    </div>
                  )}
                  {orderedProducts.map((p, i) => (
                    <div key={p.id} onClick={() => selectProduct(p)} onContextMenu={(e) => { e.preventDefault(); setCtxItem(p); ctxOpen(e); }} className="p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all" style={{ background: selected?.id === p.id ? 'var(--admin-border2)' : hoveredId === p.id ? 'var(--admin-border3)' : 'transparent', border: `1px solid ${selected?.id === p.id ? 'var(--admin-border)' : 'transparent'}` }} onMouseEnter={() => setHoveredId(p.id)} onMouseLeave={() => setHoveredId(null)}>
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); moveItem('productOrder', catalogIds, i, -1); }} disabled={i === 0} className="p-0" style={{ color: i === 0 ? 'var(--admin-surface3)' : 'var(--admin-gold)' }}><ChevronUp size={10} /></button>
                        <button onClick={e => { e.stopPropagation(); moveItem('productOrder', catalogIds, i, 1); }} disabled={i === orderedProducts.length - 1} className="p-0" style={{ color: i === orderedProducts.length - 1 ? 'var(--admin-surface3)' : 'var(--admin-gold)' }}><ChevronDown size={10} /></button>
                      </div>
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--admin-bg)' }}>
                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package size={10} style={{ color: 'var(--admin-surface3)' }} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{p.name}</p>
                        <p className="text-[9px]" style={{ color: 'var(--admin-muted2)' }}>{p.salePrice} DA</p>
                      </div>
                      <span className="text-[8px] font-mono" style={{ color: 'var(--admin-muted3)' }}>#{i + 1}</span>
                    </div>
                  ))}
                </>
              )}

              {/* ── CATEGORIES LIST ── */}
              {leftTab === 'categories' && (
                <>
                  {orderedCategories.length === 0 && (
                    <button onClick={seedCategories} className="w-full py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 gold-btn">
                      <Sparkles size={10} /> Charger les catégories par défaut
                    </button>
                  )}
                  <div className="space-y-1">
                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nouvelle catégorie..." className="input-field flex-1 text-[10px] py-1.5 w-full" onKeyDown={e => e.key === 'Enter' && addCategory()} />
                    <input value={newCatImageUrl} onChange={e => setNewCatImageUrl(e.target.value)} placeholder="URL image (optionnel)" className="input-field text-[10px] py-1.5 w-full" />
                    <button onClick={addCategory} disabled={!newCatName.trim()} className="w-full py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 disabled:opacity-30" style={{ background: 'var(--admin-gold-bg)', color: 'var(--admin-gold)', border: '1px solid rgba(191,162,78,0.2)' }}>
                      <Plus size={10} /> Ajouter
                    </button>
                  </div>
                  {orderedCategories.map((c, i) => (
                    <div key={c.id} className="p-2 rounded-lg flex items-center gap-2" style={{ background: selected?.id === c.id ? 'var(--admin-border2)' : 'transparent', border: `1px solid ${selected?.id === c.id ? 'var(--admin-border)' : 'transparent'}` }}>
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => moveItem('categoryOrder', categoriesIds, i, -1)} disabled={i === 0} className="p-0" style={{ color: i === 0 ? 'var(--admin-surface3)' : 'var(--admin-gold)' }}><ChevronUp size={10} /></button>
                        <button onClick={() => moveItem('categoryOrder', categoriesIds, i, 1)} disabled={i === orderedCategories.length - 1} className="p-0" style={{ color: i === orderedCategories.length - 1 ? 'var(--admin-surface3)' : 'var(--admin-gold)' }}><ChevronDown size={10} /></button>
                      </div>
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--admin-bg)' }}>
                        {(c as any).imageUrl ? <img src={(c as any).imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><LayoutGrid size={12} style={{ color: 'var(--admin-gold)' }} /></div>}
                      </div>
                      <p className="text-[11px] font-medium flex-1" onClick={() => { setSelected({ type: 'category', id: c.id, data: c }); if (!rightOpen) setRightOpen(true); }}>{c.name}</p>
                      <button onClick={() => setConfirmDelete({ type: 'category', id: c.id, name: c.name })} className="p-1" style={{ color: 'var(--admin-danger)' }}><Trash2 size={10} /></button>
                    </div>
                  ))}
                </>
              )}

              {/* ── SECTIONS ── */}
              {leftTab === 'sections' && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold" style={{ color: 'var(--admin-muted2)' }}>SECTIONS</p>
                  <button onClick={() => { onLayoutChange([...layoutSections, { type: 'text', content: HERO_HTML() }]); toast.success('Section Hero ajoutée'); }}
                    className="w-full p-2 rounded-lg text-left flex items-center gap-2" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border3)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--admin-gold-bg)' }}><Layout size={14} style={{ color: 'var(--admin-gold)' }} /></div>
                    <div><p className="text-[11px] font-semibold">Hero</p><p className="text-[8px]" style={{ color: 'var(--admin-muted2)' }}>Bannière principale</p></div>
                  </button>
                  <button onClick={() => { onLayoutChange([...layoutSections, { type: 'text', content: GRID_HTML(3) }]); toast.success('Grille produits ajoutée'); }}
                    className="w-full p-2 rounded-lg text-left flex items-center gap-2" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border3)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--admin-gold-bg)' }}><ShoppingBag size={14} style={{ color: 'var(--admin-gold)' }} /></div>
                    <div><p className="text-[11px] font-semibold">Produits</p><p className="text-[8px]" style={{ color: 'var(--admin-muted2)' }}>Grille de produits</p></div>
                  </button>
                  <button onClick={() => { onLayoutChange([...layoutSections, { type: 'text', content: FEATURES_HTML() }]); toast.success('Section Features ajoutée'); }}
                    className="w-full p-2 rounded-lg text-left flex items-center gap-2" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border3)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--admin-gold-bg)' }}><Zap size={14} style={{ color: 'var(--admin-gold)' }} /></div>
                    <div><p className="text-[11px] font-semibold">Features</p><p className="text-[8px]" style={{ color: 'var(--admin-muted2)' }}>3 colonnes avantages</p></div>
                  </button>
                  <button onClick={() => { onLayoutChange([...layoutSections, { type: 'text', content: `<div style="padding:60px 40px;text-align:center;background:linear-gradient(135deg,#bfa24e,#8a7530);color:#fff;font-family:Inter,sans-serif"><h2 style="font-size:1.8rem;font-weight:800;margin:0 0 12px;font-family:'Unbounded',sans-serif">Prêt à commander ?</h2><p style="font-size:1rem;margin:0 0 24px;opacity:0.9">Rejoignez nos clients satisfaits dès aujourd'hui.</p><a href="#" style="display:inline-block;padding:14px 36px;background:#fff;color:#8a7530;border-radius:10px;text-decoration:none;font-weight:700">Commander maintenant</a></div>` }]); toast.success('Section CTA ajoutée'); }}
                    className="w-full p-2 rounded-lg text-left flex items-center gap-2" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border3)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--admin-gold-bg)' }}><Star size={14} style={{ color: 'var(--admin-gold)' }} /></div>
                    <div><p className="text-[11px] font-semibold">CTA</p><p className="text-[8px]" style={{ color: 'var(--admin-muted2)' }}>Appel à l'action</p></div>
                  </button>
                  <button onClick={() => { onLayoutChange([...layoutSections, { type: 'text', content: `<div style="padding:60px 40px;background:transparent;font-family:Inter,sans-serif;text-align:center"><h2 style="font-size:1.4rem;font-weight:700;margin:0 0 8px;color:#f5f1e8;font-family:'Unbounded',sans-serif">Contactez-nous</h2><p style="font-size:0.9rem;color:#8c8578;margin:0 0 28px">Une question ?</p><div style="max-width:500px;margin:0 auto;display:flex;flex-direction:column;gap:10px"><input placeholder="Nom" style="padding:12px 16px;border-radius:10px;border:1px solid rgba(191,162,78,0.12);background:#1a1a1a;color:#f5f1e8"><input placeholder="Email" style="padding:12px 16px;border-radius:10px;border:1px solid rgba(191,162,78,0.12);background:#1a1a1a;color:#f5f1e8"><textarea placeholder="Message" rows={3} style="padding:12px 16px;border-radius:10px;border:1px solid rgba(191,162,78,0.12);background:#1a1a1a;color:#f5f1e8"></textarea><button style="padding:12px;border-radius:10px;background:linear-gradient(135deg,#bfa24e,#8a7530);color:#fff;border:none;font-weight:700">Envoyer</button></div></div>` }]); toast.success('Section Contact ajoutée'); }}
                    className="w-full p-2 rounded-lg text-left flex items-center gap-2" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border3)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--admin-gold-bg)' }}><Mail size={14} style={{ color: 'var(--admin-gold)' }} /></div>
                    <div><p className="text-[11px] font-semibold">Contact</p><p className="text-[8px]" style={{ color: 'var(--admin-muted2)' }}>Formulaire contact</p></div>
                  </button>
                  <div className="h-px" style={{ background: 'var(--admin-border2)' }} />
                  <p className="text-[10px] font-bold" style={{ color: 'var(--admin-muted2)' }}>SECTIONS AJOUTÉES ({layoutSections.length})</p>
                  {layoutSections.length === 0 && <p className="text-[9px]" style={{ color: 'var(--admin-muted3)' }}>Aucune section ajoutée. Cliquez sur une section ci-dessus pour l'ajouter.</p>}
                  {layoutSections.map((s: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg flex items-center gap-2" style={{ background: selected?.id === `section-${i}` ? 'var(--admin-border2)' : 'var(--admin-bg)', border: `1px solid ${selected?.id === `section-${i}` ? 'var(--admin-border)' : 'var(--admin-border3)'}` }}
                      onClick={() => setSelected({ type: 'section', id: `section-${i}`, data: s })}>
                      <Layout size={12} style={{ color: 'var(--admin-gold)' }} />
                      <span className="text-[10px] flex-1 truncate">Section #{i + 1}</span>
                      <button onClick={(e) => { e.stopPropagation(); const next = layoutSections.filter((_: any, j: number) => j !== i); onLayoutChange(next); if (selected?.id === `section-${i}`) setSelected(null); }}
                        className="p-1" style={{ color: 'var(--admin-danger)' }}><Trash2 size={10} /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── THEME QUICK ── */}
              {leftTab === 'theme' && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold" style={{ color: 'var(--admin-muted2)' }}>THÈMES RAPIDES</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESETS.map(p => (
                      <button key={p.name} onClick={() => { setSettings(s => ({ ...s, bgColor: p.bg, surfaceColor: p.surface, textColor: p.text, accentColor: p.accent, glowColor: p.glow })); toast.success(p.name); }} className="p-2 rounded-lg text-left" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border3)' }}>
                        <div className="flex gap-1 mb-1"><div className="w-3 h-3 rounded-full" style={{ background: p.bg, border: '1px solid var(--admin-surface3)' }} /><div className="w-3 h-3 rounded-full" style={{ background: p.accent }} /><div className="w-3 h-3 rounded-full" style={{ background: p.surface, border: '1px solid var(--admin-surface3)' }} /></div>
                        <p className="text-[9px] font-semibold">{p.name}</p>
                      </button>
                    ))}
                  </div>
                  <div className="h-px" style={{ background: 'var(--admin-border2)' }} />
                  <p className="text-[10px] font-bold" style={{ color: 'var(--admin-muted2)' }}>COULEURS</p>
                  {([['bgColor', 'Fond'], ['surfaceColor', 'Cartes'], ['textColor', 'Texte'], ['accentColor', 'Accent'], ['glowColor', 'Glow']] as const).map(([k, label]) => (
                    <div key={k} className="flex items-center gap-2">
                      <input type="color" value={settings[k]} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))} className="w-6 h-6 rounded border-0 cursor-pointer" />
                      <span className="text-[10px] flex-1" style={{ color: 'var(--admin-muted)' }}>{label}</span>
                      <input value={settings[k]} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))} className="text-[9px] font-mono w-16 text-right bg-transparent border-0 outline-none" style={{ color: 'var(--admin-muted2)' }} />
                    </div>
                  ))}
                  <div className="h-px" style={{ background: 'var(--admin-border2)' }} />
                  <p className="text-[10px] font-bold" style={{ color: 'var(--admin-muted2)' }}>ARRIÈRE-PLAN</p>
                  <div className="flex gap-1">
                    {(['color', 'image', 'video'] as const).map(bt => (
                      <button key={bt} onClick={() => setSettings(s => ({ ...s, backgroundType: bt }))}
                        className="flex-1 py-1.5 rounded-lg text-[9px] font-semibold"
                        style={{ background: settings.backgroundType === bt ? 'var(--admin-border2)' : 'var(--admin-bg)', color: settings.backgroundType === bt ? 'var(--admin-gold)' : 'var(--admin-muted)', border: `1px solid ${settings.backgroundType === bt ? 'var(--admin-border)' : 'var(--admin-border3)'}` }}>
                        {bt === 'color' ? 'Couleur' : bt === 'image' ? 'Image' : 'Vidéo'}
                      </button>
                    ))}
                  </div>
                  {settings.backgroundType !== 'color' && (
                    <div className="space-y-2">
                      <input ref={bgFileRef} type="file" accept={settings.backgroundType === 'video' ? 'video/*' : 'image/*'} className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setBgUploading(true);
                          try {
                            const fd = new FormData();
                            const fieldName = settings.backgroundType === 'video' ? 'video' : 'image';
                            const endpoint = settings.backgroundType === 'video' ? '/upload/video' : '/upload/image';
                            fd.append(fieldName, file);
                            const r = await api.post(endpoint, fd);
                            setSettings((s: ThemeSettings) => ({ ...s, backgroundImage: r.data.url }));
                            toast.success('Arrière-plan uploadé !');
                          } catch (err: any) {
                            toast.error(err?.response?.data?.error || err.message || 'Erreur upload');
                          }
                          setBgUploading(false);
                          if (bgFileRef.current) bgFileRef.current.value = '';
                        }} />
                      <button onClick={() => bgFileRef.current?.click()} disabled={bgUploading}
                        className="w-full py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 disabled:opacity-40"
                        style={{ background: 'var(--admin-bg)', color: settings.backgroundImage ? 'var(--admin-gold)' : 'var(--admin-muted2)', border: '1px solid var(--admin-border3)' }}>
                        <Upload size={10} /> {bgUploading ? 'Upload...' : settings.backgroundImage ? 'Changer' : 'Choisir un fichier'}
                      </button>
                      {settings.backgroundImage && (
                        <div className="relative rounded-lg overflow-hidden" style={{ height: 60 }}>
                          {settings.backgroundType === 'video' ? (
                            <video src={settings.backgroundImage} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                          ) : (
                            <img src={settings.backgroundImage} alt="" className="w-full h-full object-cover" />
                          )}
                          <button onClick={() => setSettings((s: ThemeSettings) => ({ ...s, backgroundImage: '' }))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--admin-overlay)', color: '#fff' }}>
                            <X size={10} />
                          </button>
                        </div>
                      )}
                      <input value={settings.backgroundImage} onChange={e => setSettings(s => ({ ...s, backgroundImage: e.target.value }))}
                        placeholder="Ou collez une URL..." className="text-[9px] font-mono w-full bg-transparent border-0 outline-none" style={{ color: 'var(--admin-muted2)' }} />
                    </div>
                  )}
                  <div className="h-px" style={{ background: 'var(--admin-border2)' }} />
                  <p className="text-[10px] font-bold" style={{ color: 'var(--admin-muted2)' }}>POLICE</p>
                  <div className="grid grid-cols-2 gap-1">
                    {FONTS.slice(0, 6).map(f => (
                      <button key={f.value} onClick={() => setSettings(s => ({ ...s, fontFamily: f.value }))} className="py-1.5 rounded-lg text-[9px]" style={{ background: settings.fontFamily === f.value ? 'var(--admin-border2)' : 'var(--admin-bg)', color: settings.fontFamily === f.value ? 'var(--admin-gold)' : 'var(--admin-muted)', fontFamily: f.value }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="h-px" style={{ background: 'var(--admin-border2)' }} />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>Glow</span>
                    <button onClick={() => setSettings(s => ({ ...s, glowEnabled: !s.glowEnabled }))}>
                      {settings.glowEnabled ? <ToggleRight size={20} style={{ color: settings.accentColor }} /> : <ToggleLeft size={20} style={{ color: 'var(--admin-surface3)' }} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>Animations</span>
                    <button onClick={() => setSettings(s => ({ ...s, animationEnabled: !s.animationEnabled }))}>
                      {settings.animationEnabled ? <ToggleRight size={20} style={{ color: settings.accentColor }} /> : <ToggleLeft size={20} style={{ color: 'var(--admin-surface3)' }} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>Effet Glass</span>
                    <button onClick={() => setSettings(s => ({ ...s, glassEnabled: !s.glassEnabled }))}>
                      {settings.glassEnabled ? <ToggleRight size={20} style={{ color: settings.accentColor }} /> : <ToggleLeft size={20} style={{ color: 'var(--admin-surface3)' }} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
